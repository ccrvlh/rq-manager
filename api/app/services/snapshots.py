"""Analytics service for managing RQ metrics collection and persistence."""

import asyncio
import logging

from typing import Optional

from rq import Queue
from rq import Worker
from redis import Redis
from rq.utils import import_attribute

from app.config import settings
from app.schemas.jobs import JobStatus
from app.db.repository import ManagerRepository


logger = logging.getLogger(__name__)


class SnapshotService:
    """Service to manage analytics collection and provide metrics."""

    def __init__(self, redis: Redis) -> None:
        self.repo = None
        self.redis = redis
        self.INTERVAL = settings.APP_ANALYTICS_COLLECTION_INTERVAL_SECONDS
        self.db_path = settings.APP_ANALYTICS_DB_PATH
        self.repo = ManagerRepository(self.db_path)
        self.collection_task: Optional[asyncio.Task] = None
        self.retention_task: Optional[asyncio.Task] = None
        self.worker_class: type[Worker] = import_attribute('rq.Worker')  # type: ignore[assignment]
        self.queue_class: type[Queue] = import_attribute('rq.Queue')  # type: ignore[assignment]
        self._running = False

    def get_workers_snapshot(self) -> list[dict]:
        """Get current worker statistics.

        Returns:
            list[dict]: Worker details including queues, state,
            job counts, and time metrics.
        """
        workers = self.worker_class.all(self.redis)
        return [
            {
                'name': w.name,
                'queues': w.queue_names(),
                'state': w.get_state(),
                'successful_job_count': w.successful_job_count,
                'failed_job_count': w.failed_job_count,
                'total_working_time': w.total_working_time,
            }
            for w in workers
        ]

    def get_queue_snapshot(self, queue_name: str) -> dict:
        """Get job counts by status for a specific queue.

        Args:
            queue_name (str): Queue name.

        Returns:
            dict: Mapping of JobStatus to counts.
        """

        queue = self.queue_class(connection=self.redis, name=queue_name)
        return {
            JobStatus.QUEUED: queue.count,
            JobStatus.STARTED: queue.started_job_registry.count,
            JobStatus.FINISHED: queue.finished_job_registry.count,
            JobStatus.FAILED: queue.failed_job_registry.count,
            JobStatus.DEFERRED: queue.deferred_job_registry.count,
            JobStatus.SCHEDULED: queue.scheduled_job_registry.count,
        }

    def get_all_queues_snapshot(self) -> dict[str, dict]:
        """Get job statistics for all queues.

        Returns:
            dict[str, dict]: Mapping of queue name to statistics.
        """

        queues = self.queue_class.all(self.redis)
        return {q.name: self.get_queue_snapshot(q.name) for q in queues}

    async def _start_collection(self, interval: int):
        """Start periodic metric collection."""
        logger.info(f"Starting analytics collection every {interval} seconds")
        while self._running:
            logger.info("Collecting analytics data...")
            await self._collect_and_store()
            await asyncio.sleep(interval)

    async def _collect_and_store(self):
        """Collect metrics and store them in SQLite.

        Collects data about workers and queues,
        then persists it through ManagerRepository.
        """
        try:
            workers_data = self.get_workers_snapshot()
            if workers_data:
                self.repo.store_worker_snapshot(workers_data)
                logger.debug(f"Stored metrics for {len(workers_data)} workers")
            queues_data = self.get_all_queues_snapshot()
            if queues_data:
                self.repo.store_queue_snapshot(queues_data)
                logger.debug(f"Stored metrics for {len(queues_data)} queues")
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")

    async def _run_retention_cleanup(self):
        """Run periodic retention cleanup."""
        while self._running:
            await asyncio.sleep(86400)  # 24 hours
            if self._running:
                await self._cleanup_old_data()

    async def _cleanup_old_data(self):
        """Clean up old analytics data based on retention policy.

        Deletes expired records based on settings.APP_ANALYTICS_RETENTION_DAYS.
        """
        try:
            retention_days = settings.APP_ANALYTICS_RETENTION_DAYS
            if self.repo:
                stats = self.repo.cleanup_old_data(retention_days)
                logger.info(
                    f"Retention cleanup completed: {stats['total_deleted']} records deleted (older than {retention_days} days)"
                )
        except Exception as e:
            logger.error(f"Error during retention cleanup: {e}")

    ## Hooks

    async def start(self, db_path: Optional[str] = None, interval: Optional[int] = None):
        """Start the analytics collection service.

        Args:
            db_path (Optional[str], optional): Path to SQLite DB. Defaults to settings.APP_ANALYTICS_DB_PATH.
            interval (Optional[int], optional): Collection interval in seconds. Defaults to settings.APP_ANALYTICS_COLLECTION_INTERVAL_SECONDS.
        """
        try:

            if db_path is None:
                db_path = settings.APP_ANALYTICS_DB_PATH
            if interval is None:
                interval = settings.APP_ANALYTICS_COLLECTION_INTERVAL_SECONDS

            self._running = True
            self.collection_task = asyncio.create_task(self._start_collection(interval))
            self.retention_task = asyncio.create_task(self._run_retention_cleanup())

            logger.info(f"Analytics service started with {interval}s collection interval")

        except Exception as e:
            logger.error(f"Failed to start analytics service: {e}")
            raise

    async def stop(self):
        """Stop the analytics collection service."""
        self._running = False

        if self.collection_task and not self.collection_task.done():
            self.collection_task.cancel()
            try:
                await self.collection_task
            except asyncio.CancelledError:
                pass

        if self.retention_task and not self.retention_task.done():
            self.retention_task.cancel()
            try:
                await self.retention_task
            except asyncio.CancelledError:
                pass

        logger.info("Analytics service stopped")
