"""Dependency injection for services."""

from typing import AsyncGenerator

import redis

from app.core.redis import redis_manager
from app.db.repository import ManagerRepository
from app.services.jobs import JobService
from app.services.queues import QueueService
from app.services.workers import WorkerService
from app.services.scheduled import ScheduledJobService
from app.services.snapshots import SnapshotService
from app.services.schedulers import SchedulerService


async def get_repo() -> ManagerRepository:
    """Get cached instance of analytics database.

    Returns:
        ManagerRepository: Repository for accessing queue and worker analytics data.
    """
    return ManagerRepository()


async def get_worker_service_dependency() -> AsyncGenerator[WorkerService, None]:
    """Dependency injection function for worker service."""
    redis = redis_manager.get_connection()
    service = WorkerService(redis=redis)
    yield service


async def get_scheduled_job_service(redis: redis.Redis) -> ScheduledJobService:
    """Get cached instance of scheduled job service."""
    return ScheduledJobService(redis=redis)


async def get_job_service_dependency() -> AsyncGenerator[JobService, None]:
    """Dependency injection function for job service."""
    redis = redis_manager.get_connection()
    service = JobService(redis=redis)
    yield service


async def get_queue_service(redis: redis.Redis) -> QueueService:
    """Get cached instance of queue service."""
    return QueueService(redis=redis)


async def get_queue_service_dependency() -> AsyncGenerator[QueueService, None]:
    """Dependency injection function for queue service."""
    redis = redis_manager.get_connection()
    service = await get_queue_service(redis=redis)
    yield service


async def get_scheduled_job_service_dependency() -> AsyncGenerator[ScheduledJobService, None]:
    """Dependency injection function for scheduled job service."""
    redis = redis_manager.get_connection()
    service = await get_scheduled_job_service(redis=redis)
    yield service


async def get_metrics_service(redis: redis.Redis) -> SnapshotService:
    """Get cached instance of metrics service."""
    service = SnapshotService(redis=redis)
    return service


async def get_metrics_service_dependency() -> AsyncGenerator[SnapshotService, None]:
    """Dependency injection function for metrics service."""
    redis = redis_manager.get_connection()
    service = await get_metrics_service(redis=redis)
    yield service


async def get_scheduler_service(redis: redis.Redis) -> SchedulerService:
    """Get cached instance of scheduler service."""
    return SchedulerService(redis=redis)


async def get_scheduler_service_dependency() -> AsyncGenerator[SchedulerService, None]:
    """Dependency injection function for scheduler service."""
    redis = redis_manager.get_connection()
    service = await get_scheduler_service(redis=redis)
    yield service
