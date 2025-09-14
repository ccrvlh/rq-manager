"""Scheduler service for RQ Scheduler management."""

import logging

from datetime import datetime

import redis

from app.const import RQ_SCHEDULER_INSTANCE_KEY_PREFIX
from app.schemas.schedulers import SchedulerCounts
from app.schemas.schedulers import SchedulerDetails
from app.utils.datetime_utils import get_timezone_aware_now


logger = logging.getLogger(__name__)


class SchedulerService:
    """Service for managing RQ Scheduler information."""

    def __init__(self, redis: redis.Redis):
        """Initialize the scheduler service with Redis connection."""
        self.redis = redis

    def list_schedulers(self) -> list[SchedulerDetails]:
        """Get all RQ Scheduler instances.

        Returns:
            list[SchedulerDetails]: Metadata for each scheduler instance.
        """
        schedulers = []
        scheduler_keys = list(self.redis.keys(f"{RQ_SCHEDULER_INSTANCE_KEY_PREFIX}:*"))

        if not scheduler_keys:
            return []

        for key in scheduler_keys:
            key_str = key.decode() if isinstance(key, bytes) else str(key)
            instance_id = key_str.split(":")[-1]

            scheduler_data = dict(self.redis.hgetall(key_str))
            birth_timestamp = scheduler_data.get(b'birth') or scheduler_data.get('birth')

            if birth_timestamp:
                if isinstance(birth_timestamp, bytes):
                    birth_timestamp = birth_timestamp.decode()
                birth_date = datetime.fromtimestamp(float(birth_timestamp))
            else:
                birth_date = get_timezone_aware_now()

            try:
                scheduled_jobs_count = int(
                    self.redis.zcard(f"{RQ_SCHEDULER_INSTANCE_KEY_PREFIX}:{instance_id}:scheduled_jobs") or 0
                )
            except Exception as e:
                logger.debug(f"Error getting scheduled jobs count for scheduler {instance_id}: {e}", exc_info=True)
                scheduled_jobs_count = 0

            scheduler = SchedulerDetails(
                id=instance_id,
                name=f"scheduler-{instance_id[:8]}",
                created_at=birth_date,
                updated_at=get_timezone_aware_now(),
                status="active",
                birth_date=birth_date,
                last_heartbeat=birth_date,
                scheduled_jobs_count=scheduled_jobs_count,
            )
            schedulers.append(scheduler)

        return schedulers

    def get_scheduler_counts(self) -> SchedulerCounts:
        """Get counts of schedulers by status.

        Returns:
            SchedulerCounts: Object with total, active, and inactive counts.
        """
        schedulers = self.list_schedulers()

        total = len(schedulers)
        active = sum(1 for s in schedulers if s.status == "active")
        inactive = total - active

        return SchedulerCounts(total=total, active=active, inactive=inactive)
