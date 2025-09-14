"""
Litestar application factory module.

This module provides the main Litestar application factory.
"""

from logging import getLogger
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from litestar import Litestar

from app.core.redis import redis_manager
from app.services.snapshots import SnapshotService


logger = getLogger(__name__)


@asynccontextmanager
async def snapshot_lifespan(app: Litestar) -> AsyncGenerator[None, None]:
    """Lifespan context manager for managing the snapshot service.

    This function initializes the snapshot service on application startup and
    ensures it is properly shut down on application shutdown.
    """
    connection = redis_manager.get_connection()
    svc = SnapshotService(connection)
    await svc.start()
    yield
    await svc.stop()
