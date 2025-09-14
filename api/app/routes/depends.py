"""Dependency injection for services."""

from typing import AsyncGenerator

from app.core.redis import redis_manager
from app.db.repository import ManagerRepository
from app.services.jobs import JobService
from app.services.queues import QueueService
from app.services.workers import WorkerService
from app.services.scheduled import ScheduledJobService
from app.services.snapshots import SnapshotService
from app.services.schedulers import SchedulerService


async def get_repo() -> AsyncGenerator[ManagerRepository, None]:
    """Dependency injection function for the repository."""
    svc = ManagerRepository()
    yield svc


async def get_worker_service_dependency() -> AsyncGenerator[WorkerService, None]:
    """Dependency injection function for worker service."""
    redis = redis_manager.get_connection()
    service = WorkerService(redis=redis)
    yield service


async def get_job_service_dependency() -> AsyncGenerator[JobService, None]:
    """Dependency injection function for job service."""
    redis = redis_manager.get_connection()
    service = JobService(redis=redis)
    yield service


async def get_queue_service_dependency() -> AsyncGenerator[QueueService, None]:
    """Dependency injection function for queue service."""
    redis = redis_manager.get_connection()
    service = QueueService(redis=redis)
    yield service


async def get_scheduled_job_service_dependency() -> AsyncGenerator[ScheduledJobService, None]:
    """Dependency injection function for scheduled job service."""
    redis = redis_manager.get_connection()
    service = ScheduledJobService(redis=redis)
    yield service


async def get_snapshot_svc_dependency() -> AsyncGenerator[SnapshotService, None]:
    """Dependency injection function for metrics service."""
    redis = redis_manager.get_connection()
    service = SnapshotService(redis=redis)
    yield service


async def get_scheduler_service_dependency() -> AsyncGenerator[SchedulerService, None]:
    """Dependency injection function for scheduler service."""
    redis = redis_manager.get_connection()
    service = SchedulerService(redis=redis)
    yield service
