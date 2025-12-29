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
                (queue, JobStatus.QUEUED, True),
                (StartedJobRegistry(queue.name, connection=self.redis), JobStatus.STARTED, True),
                (FinishedJobRegistry(queue.name, connection=self.redis), JobStatus.FINISHED, True),
                (FailedJobRegistry(queue.name, connection=self.redis), JobStatus.FAILED, True),
                (DeferredJobRegistry(queue.name, connection=self.redis), JobStatus.DEFERRED, True),
                (ScheduledJobRegistry(queue.name, connection=self.redis), JobStatus.SCHEDULED, False),
                (CanceledJobRegistry(queue.name, connection=self.redis), JobStatus.CANCELED, False),
            ]

            if settings.APP_ENABLE_RQ_SCHEDULER:
                job_sources.append((RQSchedulerRegistry(queue.name, connection=self.redis), JobStatus.SCHEDULED, False))

            jobs_to_fetch_per_registry = filters.limit * 3
            for registry, job_status, desc_order in job_sources:
                if job_status == JobStatus.QUEUED:
                    job_ids = registry.get_job_ids()  # type: ignore
                else:
                    job_ids = registry.get_job_ids(cleanup=False, desc=desc_order)  # type: ignore

                if filters.status and job_status != filters.status:
                    continue

                if not job_ids:
                    continue

                limited_job_ids = job_ids[:jobs_to_fetch_per_registry]
                total_count += len(job_ids)

                try:
                    page_ids_str = [
                        job_id.decode('utf-8') if isinstance(job_id, bytes) else str(job_id) for job_id in limited_job_ids
                    ]
                    jobs = Job.fetch_many(page_ids_str, connection=self.redis)
                except Exception as e:
                    logger.warning(f"Error fetching jobs {limited_job_ids}: {e}")
                    continue

                for job in jobs:
                    if job is None:
                        continue

                    # Safely get func_name to avoid deserialization errors
                    try:
                        job_func_name = job.func_name
                    except Exception:
                        job_func_name = "unknown"

                    if filters.function and job_func_name != filters.function:
                        continue
                    if filters.worker and job.worker_name != filters.worker:
                        continue
                    if filters.search:
                        search_text = f"{job_func_name} {job.args} {job.kwargs}".lower()
                        if filters.search.lower() not in search_text:
                            continue
                    if filters.tags and hasattr(job, "meta"):
                        job_tags = job.meta.get("tags", [])
                        if not any(tag in job_tags for tag in filters.tags):
                            continue

                    job_detail = self._map_rq_job_to_schema(job, queue.name, include_result=False, include_exc_info=False, status=job_status)

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

        paginated_jobs = collected[filters.offset : filters.offset + filters.limit]
        return paginated_jobs, total_count

    def get_jobs_for_worker(self, worker_name: str) -> list[JobDetails]:
        """Get all jobs associated with a specific worker.

        Args:
            worker_name (str): The RQ worker name.

        Returns:
            list[JobDetails]: All jobs started/finished/failed/deferred by this worker.
        """
        jobs = []
        jobs_by_status: dict[JobStatus, list[str]] = {
            JobStatus.STARTED: [],
            JobStatus.FINISHED: [],
            JobStatus.FAILED: [],
            JobStatus.DEFERRED: [],
        }

        try:
            queues = Queue.all(connection=self.redis)

            for queue in queues:
                started_registry = StartedJobRegistry(queue.name, connection=self.redis)
                jobs_by_status[JobStatus.STARTED].extend(started_registry.get_job_ids(cleanup=False))

                finished_registry = FinishedJobRegistry(queue.name, connection=self.redis)
                jobs_by_status[JobStatus.FINISHED].extend(finished_registry.get_job_ids(cleanup=False)[-50:])

                failed_registry = FailedJobRegistry(queue.name, connection=self.redis)
                jobs_by_status[JobStatus.FAILED].extend(failed_registry.get_job_ids(cleanup=False)[-50:])

                deferred_registry = DeferredJobRegistry(queue.name, connection=self.redis)
                jobs_by_status[JobStatus.DEFERRED].extend(deferred_registry.get_job_ids(cleanup=False))

        except Exception as e:
            logger.error(f"Error getting jobs for worker {worker_name}: {e}")
            return []

        all_job_ids: list[str] = []
        for job_ids in jobs_by_status.values():
            all_job_ids.extend(job_ids)

        if not all_job_ids:
            return []

        try:
            page_ids_str = [
                job_id.decode('utf-8') if isinstance(job_id, bytes) else str(job_id) for job_id in all_job_ids
            ]
            fetched_jobs = Job.fetch_many(page_ids_str, connection=self.redis)
        except Exception as e:
            logger.warning(f"Error fetching jobs for worker {worker_name}: {e}")
            return []

        job_id_to_status: dict[str, JobStatus] = {}
        for status, job_ids in jobs_by_status.items():
            for job_id in job_ids:
                job_id_str = job_id.decode('utf-8') if isinstance(job_id, bytes) else str(job_id)
                job_id_to_status[job_id_str] = status

        for job in fetched_jobs:
            if job is None:
                continue
            if job.worker_name == worker_name:
                status = job_id_to_status.get(job.id, JobStatus.QUEUED)
                jobs.append(self._map_rq_job_to_schema(job, queue.name if 'queue' in dir() else 'default', include_result=False, status=status))

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
                meta=dict(job_data.meta) if job_data.meta else None,
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

    def _map_rq_job_to_schema(self, rq_job: Job, queue_name: str, include_result: bool = True, include_exc_info: bool = True, status: JobStatus | None = None) -> JobDetails:
        """Map RQ job object to JobDetails schema.
        
        Args:
            rq_job: The RQ job object
            queue_name: The queue name
            include_result: Whether to include the job result (expensive, defaults True)
            include_exc_info: Whether to include exception info (expensive, defaults True)
            status: Pre-determined status to avoid Redis call (optional)
        """
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

            if status is not None:
                job_status = status
            else:
                job_status = status_mapping.get(rq_job.get_status().lower(), JobStatus.QUEUED)

            # Get job metadata
            meta_data = {}
            if rq_job.meta:
                meta_data = dict(rq_job.meta)

            # Calculate duration from start/end times
            duration_seconds = get_duration_seconds(rq_job.started_at, rq_job.ended_at)

            # Safely get func_name without triggering deserialization errors
            try:
                func_name = rq_job.func_name or "unknown"
            except Exception:
                func_name = "unknown"

            try:
                args = rq_job.args or []
            except Exception:
                args = []

            try:
                kwargs = rq_job.kwargs or {}
            except Exception:
                kwargs = {}

            return JobDetails(
                id=rq_job.id,
                created_at=ensure_timezone_aware(rq_job.created_at) or get_timezone_aware_now(),
                func_name=func_name,
                args=args,
                kwargs=kwargs,
                status=job_status,
                queue=queue_name,
                worker_name=rq_job.worker_name,
                started_at=ensure_timezone_aware(rq_job.started_at),
                ended_at=ensure_timezone_aware(rq_job.ended_at),
                duration_seconds=duration_seconds,
                last_heartbeat=ensure_timezone_aware(getattr(rq_job, 'last_heartbeat', None)),
                result=rq_job.result if include_result else None,
                exc_info=rq_job.exc_info if include_exc_info else None,
                traceback=getattr(rq_job, 'exc_info', None) if include_exc_info else None,
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
            logger.error(f"Error mapping job {rq_job.id}: {e}", exc_info=True)
            # Safely get job ID without triggering deserialization
            job_id = getattr(rq_job, 'id', 'unknown')
            return JobDetails(
                id=str(job_id) if job_id else 'unknown',
                created_at=get_timezone_aware_now(),
                func_name="unknown (deserialization error)",
                status=JobStatus.FAILED,
                queue=queue_name,
            )
