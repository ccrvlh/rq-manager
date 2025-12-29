"""Scheduled job service that interacts with RQ Scheduler."""

import logging
import redis

from datetime import datetime

from rq.job import Job
from rq_scheduler import Scheduler  # type: ignore[import]

from app.schemas.scheduled import ScheduledJobDetails
from app.utils.datetime_utils import ensure_timezone_aware
from app.utils.datetime_utils import get_timezone_aware_min
from app.utils.datetime_utils import get_timezone_aware_now


logger = logging.getLogger(__name__)


class ScheduledJobService:
    """Service for managing RQ scheduled job information."""

    def __init__(self, redis: redis.Redis):
        """Initialize the scheduled job service with RQ connection."""
        self.redis = redis
        self.scheduler = None

    def _get_scheduler(self) -> Scheduler:
        """Get or create RQ Scheduler instance."""
        if self.scheduler is None:
            self.scheduler = Scheduler(connection=self.redis)
        return self.scheduler

    def list_scheduled_jobs(self, limit: int = 50, offset: int = 0) -> tuple[list[ScheduledJobDetails], int]:
        """List all scheduled jobs with pagination.

        Args:
            limit (int, optional): Maximum number of jobs to return. Defaults to 50.
            offset (int, optional): Pagination offset. Defaults to 0.

        Returns:
            tuple[list[ScheduledJobDetails], int]: A tuple of (list of jobs, total count).
        """
        try:
            scheduler = self._get_scheduler()
            job_ids_with_times = self.redis.zrangebyscore(
                scheduler.scheduled_jobs_key,
                0,
                '+inf',
                withscores=True
            )
            
            if not job_ids_with_times:
                return [], 0

            job_ids = [job_id.decode('utf-8') if isinstance(job_id, bytes) else str(job_id)
                      for job_id, _ in job_ids_with_times]
            
            scheduled_jobs = Job.fetch_many(job_ids, connection=self.redis)
            scheduled_times = {
                (job_id.decode('utf-8') if isinstance(job_id, bytes) else str(job_id)): datetime.utcfromtimestamp(score)
                for job_id, score in job_ids_with_times
            }

            job_details = []
            for job in scheduled_jobs:
                if job is None:
                    continue

                scheduled_time = scheduled_times.get(job.id)
                detail = self._map_scheduled_job_to_schema(job, scheduled_time)
                job_details.append(detail)

            job_details.sort(key=lambda x: ensure_timezone_aware(x.scheduled_for) or get_timezone_aware_min())
            total_count = len(job_details)
            paginated_jobs = job_details[offset : offset + limit]

            return paginated_jobs, total_count

        except Exception as e:
            logger.error(f"Error listing scheduled jobs: {e}")
            return [], 0

    def get_scheduled_job_counts(self) -> dict[str, int]:
        """Get counts of scheduled jobs.

        Returns:
            dict[str, int]: A dictionary with counts of total, pending, and overdue scheduled jobs.
        """
        try:
            scheduler = self._get_scheduler()
            total_count = self.redis.zcard(scheduler.scheduled_jobs_key)
            
            now_timestamp = datetime.utcnow().timestamp()
            overdue_count = self.redis.zcount(scheduler.scheduled_jobs_key, 0, now_timestamp)
            
            counts = {
                "total": total_count,
                "pending": total_count - overdue_count,
                "overdue": overdue_count,
            }

            return counts

        except Exception as e:
            logger.error(f"Error getting scheduled job counts: {e}")
            return {"total": 0, "pending": 0, "overdue": 0}

    def delete_scheduled_job(self, job_id: str) -> bool:
        """Delete a scheduled job.

        Args:
            job_id (str): Unique job ID.

        Returns:
            bool: True if deleted successfully, False otherwise.
        """
        try:
            scheduler = self._get_scheduler()
            scheduler.cancel(job_id)
            return True
        except Exception as e:
            logger.error(f"Error deleting scheduled job {job_id}: {e}")
            return False

    def _map_scheduled_job_to_schema(self, scheduled_job, scheduled_time: datetime | None = None) -> ScheduledJobDetails:
        """Map RQ scheduled job to ScheduledJobDetails schema.

        Args:
            scheduled_job: The RQ scheduled job object.
            scheduled_time: The scheduled execution time (optional, from sorted set score).

        Returns:
            ScheduledJobDetails: Serialized job details.
        """
        try:
            meta = dict(scheduled_job.meta) if hasattr(scheduled_job, 'meta') and scheduled_job.meta else {}
            cron = meta.get('cron_string') or meta.get('cron') or getattr(scheduled_job, 'cron', None)
            repeat = meta.get('repeat') or getattr(scheduled_job, 'repeat', None)
            interval = meta.get('interval') or getattr(scheduled_job, 'interval', None)

            return ScheduledJobDetails(
                id=scheduled_job.id,
                func_name=scheduled_job.func_name or "unknown",
                args=list(scheduled_job.args) if scheduled_job.args else [],
                kwargs=dict(scheduled_job.kwargs) if scheduled_job.kwargs else {},
                queue=getattr(scheduled_job, 'origin', 'default'),
                scheduled_for=ensure_timezone_aware(scheduled_time) if scheduled_time else ensure_timezone_aware(getattr(scheduled_job, 'scheduled_for', None)),
                created_at=ensure_timezone_aware(getattr(scheduled_job, 'created_at', None)) or get_timezone_aware_now(),
                timeout=getattr(scheduled_job, 'timeout', None),
                description=getattr(scheduled_job, 'description', None),
                meta=meta,
                cron=cron,
                repeat=repeat,
                interval=interval,
            )
        except Exception as e:
            logger.error(f"Error mapping scheduled job {scheduled_job.id}: {e}")
            return ScheduledJobDetails(
                id=str(getattr(scheduled_job, 'id', 'unknown')),
                func_name=str(getattr(scheduled_job, 'func_name', 'unknown')),
                scheduled_for=get_timezone_aware_now(),
                created_at=get_timezone_aware_now(),
            )
