"""Job service that interacts with RQ to get job information."""

import logging
import datetime as dt

from typing import Optional

import redis

from rq.job import Job
from rq.queue import Queue
from rq.registry import FailedJobRegistry
from rq.registry import StartedJobRegistry
from rq.registry import CanceledJobRegistry
from rq.registry import DeferredJobRegistry
from rq.registry import FinishedJobRegistry
from rq.registry import ScheduledJobRegistry

from app.config import settings
from app.schemas.jobs import BaseJob
from app.schemas.jobs import JobCreate
from app.schemas.jobs import JobStatus
from app.schemas.jobs import JobUpdate
from app.schemas.jobs import JobDetails
from app.schemas.jobs import JobListFilters
from app.extensions.scheduler import RQSchedulerRegistry
from app.utils.datetime_utils import get_duration_seconds
from app.utils.datetime_utils import ensure_timezone_aware
from app.utils.datetime_utils import get_timezone_aware_min
from app.utils.datetime_utils import get_timezone_aware_now


logger = logging.getLogger(__name__)


class JobService:
    """Service for managing RQ job information."""

    def __init__(self, redis: redis.Redis):
        """Initialize the job service with RQ connection."""
        self.redis = redis

    def get_job(self, job_id: str) -> Optional[JobDetails]:
        """Get a specific job by ID.

        Args:
            job_id (str): Unique identifier for the job.

        Returns:
            Optional[JobDetails]: Job details if job exists, otherwise None.
        """
        try:
            job = Job.fetch(job_id, connection=self.redis)
            queue_name = self._determine_job_queue(job)
            return self._map_rq_job_to_schema(job, queue_name)
        except Exception as e:
            logger.error(f"Error getting job {job_id}: {e}")
            return None

    def list_jobs(self, filters: JobListFilters | None = None) -> tuple[list[JobDetails], int]:
        """List all jobs with optional filtering and pagination.

        Args:
            filters (JobListFilters | None): Criteria to filter jobs, including
                queue, status, search terms, worker, created_at timestamps
                and pagination options.

        Returns:
            tuple[list[JobDetails], int]: A tuple of (list of jobs, total count).
        """
        if filters is None:
            filters = JobListFilters()

        try:
            queues = Queue.all(connection=self.redis)
        except Exception as e:
            logger.error(f"Error listing queues: {e}")
            return [], 0

        collected: list["JobDetails"] = []
        total_count = 0

        for queue in queues:
            if filters.queue and queue.name != filters.queue:
                continue

            job_sources = [
                (queue.get_job_ids(), JobStatus.QUEUED),
                (StartedJobRegistry(queue.name, connection=self.redis).get_job_ids(cleanup=False), JobStatus.STARTED),
                (FinishedJobRegistry(queue.name, connection=self.redis).get_job_ids(cleanup=False), JobStatus.FINISHED),
                (FailedJobRegistry(queue.name, connection=self.redis).get_job_ids(cleanup=False), JobStatus.FAILED),
                (DeferredJobRegistry(queue.name, connection=self.redis).get_job_ids(cleanup=False), JobStatus.DEFERRED),
                (ScheduledJobRegistry(queue.name, connection=self.redis).get_job_ids(cleanup=False), JobStatus.SCHEDULED),
                (CanceledJobRegistry(queue.name, connection=self.redis).get_job_ids(cleanup=False), JobStatus.CANCELED),
            ]

            if settings.APP_ENABLE_RQ_SCHEDULER:
                job_sources.append((RQSchedulerRegistry(queue.name, connection=self.redis).get_job_ids(), JobStatus.SCHEDULED))

            for job_ids, job_status in job_sources:
                if filters.status and job_status != filters.status:
                    continue

                total_count += len(job_ids)
                if not job_ids:
                    continue

                page_ids = job_ids[filters.offset : filters.offset + filters.limit]

                try:
                    jobs = Job.fetch_many(page_ids, connection=self.redis)
                except Exception as e:
                    logger.warning(f"Error fetching jobs {page_ids}: {e}")
                    continue

                for job in jobs:
                    if job is None:
                        continue

                    if filters.function and job.func_name != filters.function:
                        continue
                    if filters.worker and job.worker_name != filters.worker:
                        continue
                    if filters.search:
                        search_text = f"{job.func_name} {job.args} {job.kwargs}".lower()
                        if filters.search.lower() not in search_text:
                            continue
                    if filters.tags and hasattr(job, "meta"):
                        job_tags = job.meta.get("tags", [])
                        if not any(tag in job_tags for tag in filters.tags):
                            continue

                    job_detail = self._map_rq_job_to_schema(job, queue.name)
                    job_detail.status = job_status

                    if filters.created_after and job_detail.created_at < filters.created_after:
                        continue
                    if filters.created_before and job_detail.created_at > filters.created_before:
                        continue

                    collected.append(job_detail)

        sort_by = filters.sort_by or "created_at"
        sort_order = filters.sort_order or "desc"
        collected.sort(
            key=lambda j: getattr(j, sort_by, dt.datetime.min),
            reverse=(sort_order == "desc"),
        )
        return collected, total_count

    def get_jobs_for_worker(self, worker_name: str) -> list[JobDetails]:
        """Get all jobs associated with a specific worker.

        Args:
            worker_name (str): The RQ worker name.

        Returns:
            list[JobDetails]: All jobs started/finished/failed/deferred by this worker.
        """
        jobs = []

        try:
            # Get all queues
            queues = Queue.all(connection=self.redis)

            for queue in queues:
                # Check started jobs with cleanup=False
                started_registry = StartedJobRegistry(queue.name, connection=self.redis)
                job_ids = started_registry.get_job_ids(cleanup=False)
                for job_id in job_ids:
                    try:
                        job = Job.fetch(job_id, connection=self.redis)
                        if job.worker_name == worker_name:
                            jobs.append(self._map_rq_job_to_schema(job, queue.name))
                    except Exception as e:
                        logger.warning(f"Error fetching started job {job_id}: {e}")

                # Check finished jobs with cleanup=False
                finished_registry = FinishedJobRegistry(queue.name, connection=self.redis)
                job_ids = finished_registry.get_job_ids(cleanup=False)[-50:]  # Recent 50
                for job_id in job_ids:
                    try:
                        job = Job.fetch(job_id, connection=self.redis)
                        if job.worker_name == worker_name:
                            jobs.append(self._map_rq_job_to_schema(job, queue.name))
                    except Exception as e:
                        logger.warning(f"Error fetching finished job {job_id}: {e}")

                # Check failed jobs with cleanup=False
                failed_registry = FailedJobRegistry(queue.name, connection=self.redis)
                job_ids = failed_registry.get_job_ids(cleanup=False)[-50:]  # Recent 50
                for job_id in job_ids:
                    try:
                        job = Job.fetch(job_id, connection=self.redis)
                        if job.worker_name == worker_name:
                            jobs.append(self._map_rq_job_to_schema(job, queue.name))
                    except Exception as e:
                        logger.warning(f"Error fetching failed job {job_id}: {e}")

                # Check deferred jobs with cleanup=False
                deferred_registry = DeferredJobRegistry(queue.name, connection=self.redis)
                job_ids = deferred_registry.get_job_ids(cleanup=False)
                for job_id in job_ids:
                    try:
                        job = Job.fetch(job_id, connection=self.redis)
                        if job.worker_name == worker_name:
                            jobs.append(self._map_rq_job_to_schema(job, queue.name))
                    except Exception as e:
                        logger.warning(f"Error fetching deferred job {job_id}: {e}")

        except Exception as e:
            logger.error(f"Error getting jobs for worker {worker_name}: {e}")

        # Sort jobs by most recent first
        jobs.sort(
            key=lambda x: ensure_timezone_aware(x.created_at or get_timezone_aware_min()) or get_timezone_aware_min(),
            reverse=True,
        )

        return jobs

    def get_job_counts(self) -> dict[str, int]:
        """Get counts of jobs by status.

        Returns:
            dict[str, int]: Mapping of status category to number of jobs.
        """
        counts = {
            "total": 0,
            "queued": 0,
            "started": 0,
            "finished": 0,
            "failed": 0,
            "deferred": 0,
            "scheduled": 0,
        }

        try:
            queues = Queue.all(connection=self.redis)

            for queue in queues:
                try:
                    # Use cleanup=False to avoid write operations on read-only Redis
                    counts["queued"] += len(queue.get_job_ids())
                    counts["started"] += StartedJobRegistry(queue.name, connection=self.redis).get_job_count(cleanup=False)
                    counts["finished"] += FinishedJobRegistry(queue.name, connection=self.redis).get_job_count(cleanup=False)
                    counts["failed"] += FailedJobRegistry(queue.name, connection=self.redis).get_job_count(cleanup=False)
                    counts["deferred"] += DeferredJobRegistry(queue.name, connection=self.redis).get_job_count(cleanup=False)
                except Exception as e:
                    logger.warning(f"Error counting jobs for queue {queue.name}: {e}")
                    continue

            counts["total"] = sum(v for k, v in counts.items() if k != "total")
            return counts

        except Exception as e:
            logger.error(f"Error getting job counts: {e}")
            return counts

    def create_job(self, job_data: JobCreate) -> Optional[BaseJob]:
        """Create a new job.

        Note:
            This method is a placeholder. Actual implementation
            would enqueue jobs properly.

        Args:
            job_data (JobCreate): Data for creating the job.

        Returns:
            Optional[BaseJob]: Created job instance.
        """
        try:
            j = Job.create(
                id='manually-created-crazy-job',
                func=job_data.func_name,
                args=job_data.args,
                kwargs=job_data.kwargs,
                meta=job_data.meta or {},
                connection=self.redis,
            )
            q = Queue(name=job_data.queue or "default", connection=self.redis)
            q.enqueue_job(j)
            return self._map_rq_job_to_schema(j, job_data.queue or "default")
        except Exception as e:
            logger.error(f"Error creating job: {e}")
            return None

    def update_job(self, job_id: str, update_data: JobUpdate) -> Optional[JobDetails]:
        """Update a job.

        Note:
            Most job attributes can't be updated once created. This method
            is mostly for metadata or limited updates.

        Args:
            job_id (str): Job identifier.
            update_data (JobUpdate): Update payload.

        Returns:
            Optional[JobDetails]: Updated job if successful.
        """
        try:
            job = self.get_job(job_id)
            if not job:
                return None

            # Note: Most job attributes can't be updated after creation
            # This is mainly for updating metadata, status via requeuing, etc.
            logger.info(f"Job update requested for {job_id}: {update_data}")
            return job

        except Exception as e:
            logger.error(f"Error updating job {job_id}: {e}")
            return None

    def delete_job(self, job_id: str) -> bool:
        """Delete a job."""
        try:
            job = Job.fetch(job_id, connection=self.redis)
            job.cancel()
            job.delete()
            return True

        except Exception as e:
            logger.error(f"Error deleting job {job_id}: {e}")
            return False

    def retry_job(self, job_id: str) -> bool:
        """Retry a failed job."""
        try:
            job = Job.fetch(job_id, connection=self.redis)
            job.requeue()
            return True

        except Exception as e:
            logger.error(f"Error retrying job {job_id}: {e}")
            return False

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a running job."""
        try:
            return self.delete_job(job_id)
        except Exception as e:
            logger.error(f"Error canceling job {job_id}: {e}")
            return False

    def _determine_job_queue(self, rq_job: Job) -> str:
        """Determine which queue a job belongs to."""
        # Try to get queue from job data
        if hasattr(rq_job, 'origin') and rq_job.origin:
            return rq_job.origin

        queues = Queue.all(connection=self.redis)
        for queue in queues:
            if rq_job.id in queue.get_job_ids():
                return queue.name

        return "default"

    def _map_rq_job_to_schema(self, rq_job: Job, queue_name: str) -> JobDetails:
        """Map RQ job object to JobDetails schema."""
        try:
            # Map RQ status to our schema status
            status_mapping = {
                'queued': JobStatus.QUEUED,
                'started': JobStatus.STARTED,
                'finished': JobStatus.FINISHED,
                'failed': JobStatus.FAILED,
                'deferred': JobStatus.DEFERRED,
                'scheduled': JobStatus.SCHEDULED,
                'stopped': JobStatus.STOPPED,
                'canceled': JobStatus.CANCELED,
            }

            # Determine job status
            status = status_mapping.get(rq_job.get_status().lower(), JobStatus.QUEUED)

            # Get job metadata
            meta_data = {}
            if rq_job.meta:
                meta_data = dict(rq_job.meta)

            # Calculate duration from start/end times
            duration_seconds = get_duration_seconds(rq_job.started_at, rq_job.ended_at)

            return JobDetails(
                id=rq_job.id,
                created_at=ensure_timezone_aware(rq_job.created_at) or get_timezone_aware_now(),
                func_name=rq_job.func_name or "unknown",
                args=list(rq_job.args) if rq_job.args else [],
                kwargs=dict(rq_job.kwargs) if rq_job.kwargs else {},
                status=status,
                queue=queue_name,
                worker_name=rq_job.worker_name,
                started_at=ensure_timezone_aware(rq_job.started_at),
                ended_at=ensure_timezone_aware(rq_job.ended_at),
                duration_seconds=duration_seconds,
                last_heartbeat=ensure_timezone_aware(getattr(rq_job, 'last_heartbeat', None)),
                result=rq_job.result,
                exc_info=rq_job.exc_info,
                traceback=getattr(rq_job, 'exc_info', None),
                meta_full=meta_data,
                # Additional fields from RQ job
                timeout=rq_job.timeout,
                result_ttl=getattr(rq_job, 'result_ttl', None),
                ttl=getattr(rq_job, 'ttl', None),
                failure_ttl=getattr(rq_job, 'failure_ttl', None),
                retry=rq_job.retries_left if hasattr(rq_job, 'retries_left') else 0,
                max_retries=rq_job.retries if hasattr(rq_job, 'retries') else 3,
                # New RQ fields for completeness
                group_id=getattr(rq_job, 'group_id', None),
                description=getattr(rq_job, 'description', None),
            )

        except Exception as e:
            logger.error(f"Error mapping job {rq_job.id}: {e}")
            return JobDetails(
                id=str(getattr(rq_job, 'id', 'unknown')),
                created_at=get_timezone_aware_now(),
                func_name=str(getattr(rq_job, 'func_name', 'unknown')),
                status=JobStatus.FAILED,
                queue=queue_name,
            )
