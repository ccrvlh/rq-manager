"""Queue Service - Handles all queue-related operations."""

import asyncio
import logging

from typing import Optional

from rq import Queue
from redis import Redis
from rq.registry import FailedJobRegistry
from rq.registry import StartedJobRegistry
from rq.registry import DeferredJobRegistry
from rq.registry import FinishedJobRegistry
from rq.registry import ScheduledJobRegistry

from app.const import RQ_QUEUE_KEY_PREFIX
from app.schemas.queues import QueueCreate
from app.schemas.queues import QueueHealth
from app.schemas.queues import QueueStatus
from app.schemas.queues import QueueDetails
from app.schemas.queues import QueueMetrics
from app.schemas.queues import QueuePriority
from app.schemas.queues import QueueListFilters
from app.utils.datetime_utils import get_timezone_aware_now


logger = logging.getLogger(__name__)


class QueueService:
    """Service for managing RQ queues."""

    def __init__(self, redis: Redis):
        """Initialize Queue service."""
        self._redis_client = redis

    def _get_queue(self, queue_name: str) -> Queue:
        """Get a specific queue instance."""
        return Queue(queue_name, connection=self._redis_client)

    async def _get_queue_details(self, rq_queue: Queue) -> QueueDetails:
        """Get detailed information about a queue.
        When getting counts from registries, we use cleanup=False to avoid modifying the registries.

        Args:
            rq_queue (Queue): The RQ queue instance.

        Returns:
            QueueDetails: Object containing queue metadata and counts.
        """
        try:
            failed_count = 0
            deferred_count = 0
            scheduled_count = 0
            started_count = 0
            finished_count = 0
            active_jobs_count = 0

            try:
                failed_count = FailedJobRegistry(queue=rq_queue).get_job_count(cleanup=False)
                deferred_count = DeferredJobRegistry(queue=rq_queue).get_job_count(cleanup=False)
                scheduled_count = int(ScheduledJobRegistry(queue=rq_queue).get_job_count(cleanup=False))
                started_count = StartedJobRegistry(queue=rq_queue).get_job_count(cleanup=False)
                finished_count = FinishedJobRegistry(queue=rq_queue).get_job_count(cleanup=False)
            except Exception as e:
                logger.warning(f"Error getting registry counts for {rq_queue.name}: {e}")

            try:
                active_jobs_count = int(self._redis_client.llen(f"{RQ_QUEUE_KEY_PREFIX}:{rq_queue.name}"))
            except Exception as e:
                logger.error(f"Queue {rq_queue.name}: Redis llen failed: {e}")
                active_jobs_count = 0

            return QueueDetails(
                name=rq_queue.name,
                created_at=get_timezone_aware_now(),
                status=QueueStatus.ACTIVE,
                priority=QueuePriority.NORMAL,
                count=active_jobs_count,
                queued_jobs=active_jobs_count,
                started_jobs=started_count,
                failed_jobs=failed_count,
                finished_jobs=finished_count,
                deferred_jobs=deferred_count,
                scheduled_jobs=scheduled_count,
                failed_registry_count=failed_count,
                deferred_registry_count=deferred_count,
                started_registry_count=started_count,
                finished_registry_count=finished_count,
                last_activity=get_timezone_aware_now(),
                worker_count=0,
                default_job_timeout=getattr(rq_queue, '_default_timeout', 180),
                default_result_ttl=500,
                default_failure_ttl=31536000,
                tags=[],
                metadata={},
            )

        except Exception as e:
            logger.error(f"Error getting queue details for {rq_queue.name}: {e}")
            return QueueDetails(
                name=rq_queue.name,
                created_at=get_timezone_aware_now(),
                count=0,
            )

    async def list_queues(self, filters: Optional[QueueListFilters] = None) -> list[QueueDetails]:
        """Get all queues with optional filtering.

        Args:
            filters (Optional[QueueListFilters]): Filter options, including
                status, search, sorting, pagination.

        Returns:
            list[QueueDetails]: Matching queues.
        """
        filters = filters or QueueListFilters()
        queues = Queue.all(connection=self._redis_client)
        queue_details = []
        for rq_queue in queues:
            details = await self._get_queue_details(rq_queue)

            if filters.status and details.status != filters.status:
                continue

            if filters.search and filters.search.lower() not in details.name.lower():
                continue

            queue_details.append(details)

        sort_by = filters.sort_by or "name"
        reverse = filters.sort_order == "desc"

        if sort_by == "name":
            queue_details.sort(key=lambda q: q.name, reverse=reverse)
        elif sort_by == "count":
            queue_details.sort(key=lambda q: q.count, reverse=reverse)

        offset = filters.offset or 0
        limit = filters.limit or 50
        return queue_details[offset : offset + limit]

    async def get_queue(self, queue_name: str) -> QueueDetails:
        """Get a specific queue by name.

        Args:
            queue_name (str): Queue name.

        Returns:
            QueueDetails: Queue metadata and counts.
        """
        try:
            queue = self._get_queue(queue_name)
            return await self._get_queue_details(queue)
        except Exception as e:
            logger.error(f"Error getting queue {queue_name}: {e}")
            raise

    async def create_queue(self, queue_data: QueueCreate) -> QueueDetails:
        """Create a new queue.

        Args:
            queue_data (QueueCreate): Queue creation payload.

        Returns:
            QueueDetails: The newly created queue metadata.
        """
        try:
            queue = self._get_queue(queue_data.name)
            return await self._get_queue_details(queue)

        except Exception as e:
            logger.error(f"Error creating queue {queue_data.name}: {e}")
            raise

    async def delete_queue(self, queue_name: str) -> bool:
        """Delete a queue.

        Args:
            queue_name (str): Queue name.

        Returns:
            bool: True if deleted, False otherwise.
        """
        try:
            queue = self._get_queue(queue_name)
            queue.delete(delete_jobs=True)
            return True

        except Exception as e:
            logger.error(f"Error deleting queue {queue_name}: {e}")
            return False

    async def empty_queue(self, queue_name: str) -> bool:
        """Empty all jobs from a queue."""
        try:
            queue = self._get_queue(queue_name)
            removed_count = queue.empty()
            logger.info(f"Emptied {removed_count} jobs from queue {queue_name}")
            return True

        except Exception as e:
            logger.error(f"Error emptying queue {queue_name}: {e}")
            raise

    async def get_queue_metrics(self, queue_name: str, time_range: int = 3600) -> QueueMetrics:
        """Get metrics for a specific queue."""
        try:
            queue = self._get_queue(queue_name)
            details = await self._get_queue_details(queue)

            return QueueMetrics(
                timestamp=get_timezone_aware_now(),
                queue_name=queue_name,
                total_jobs=details.count,
                queued_jobs=details.queued_jobs,
                started_jobs=details.started_jobs,
                finished_jobs=details.finished_jobs,
                failed_jobs=details.failed_jobs,
                deferred_jobs=details.deferred_jobs,
                scheduled_jobs=details.scheduled_jobs,
                avg_wait_time=None,
                avg_run_time=None,
            )

        except Exception as e:
            logger.error(f"Error getting metrics for queue {queue_name}: {e}")
            raise

    async def get_queue_health(self, queue_name: str) -> QueueHealth:
        """Check health status of a queue."""
        try:
            queue = self._get_queue(queue_name)
            details = await self._get_queue_details(queue)
            loop = asyncio.get_event_loop()
            redis_connected = await loop.run_in_executor(None, lambda: bool(self._redis_client.ping()))

            return QueueHealth(
                queue_name=queue_name,
                status=QueueStatus.ACTIVE,
                is_healthy=bool(redis_connected and details.count >= 0),
                worker_count=details.worker_count,
                queued_job_count=details.count,
                redis_connection=redis_connected,
                last_activity=details.last_activity,
                response_time_ms=0.0,
            )

        except Exception as e:
            logger.error(f"Error checking health for queue {queue_name}: {e}")
            return QueueHealth(
                queue_name=queue_name,
                status=QueueStatus.FAILED,
                is_healthy=False,
                worker_count=0,
                queued_job_count=0,
                redis_connection=False,
                error_message=str(e),
            )

    async def bulk_queue_operation(self, queue_names: list[str], operation: str) -> dict[str, bool]:
        """Perform bulk operations on multiple queues."""
        results = {}

        for queue_name in queue_names:
            try:
                if operation == "delete":
                    results[queue_name] = await self.delete_queue(queue_name)
                elif operation == "empty":
                    results[queue_name] = await self.empty_queue(queue_name)
                else:
                    results[queue_name] = False
            except Exception as e:
                logger.error(f"Error performing {operation} on queue {queue_name}: {e}")
                results[queue_name] = False

        return results
