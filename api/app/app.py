"""
Litestar application factory module.

This module provides the main Litestar application factory.
"""

from logging import getLogger

from litestar import Litestar
from litestar.config.cors import CORSConfig

from app.core import handlers
from app.hooks import snapshot_lifespan
from app.config import AppConfigBuilder
from app.config import settings
from app.routes.jobs import JobsController
from app.routes.health import HealthController
from app.routes.queues import QueuesController
from app.routes.metrics import MetricsController
from app.routes.workers import WorkersController
from app.routes.analytics import AnalyticsController
from app.routes.scheduled import ScheduledJobsController
from app.routes.schedulers import SchedulersController


logger = getLogger(__name__)


def create_app(env: str = "local", **kwargs: dict) -> Litestar:
    """Create and configure a new Litestar application instance.

    Args:
        env: The environment to run the application in (e.g., "local", "dev", "prod").
        **kwargs: Additional keyword arguments to pass to the Litestar constructor.

    Returns:
        Litestar: The configured Litestar application instance.

    Raises:
        ValueError: If no environment is specified.
    """

    logger.info("Loading configuration...")
    if not env:
        raise ValueError("No environment specified. Please specify an environment.")

    builder = AppConfigBuilder(settings, env)
    builder.load()
    logger.info("Configuration loaded.")
    logger.info(f"Running on {env} environment")

    debug_mode = settings.APP_DEBUG if hasattr(settings, 'APP_DEBUG') else False
    if 'debug' in kwargs:
        debug_mode = kwargs.pop('debug')

    logger.info(f"Debug mode: {'enabled' if debug_mode else 'disabled'}")

    return Litestar(
        exception_handlers=handlers.exception_handlers,
        route_handlers=[
            JobsController,
            QueuesController,
            WorkersController,
            AnalyticsController,
            MetricsController,
            ScheduledJobsController,
            SchedulersController,
            HealthController,
        ],
        cors_config=CORSConfig(
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["*"],
        ),
        lifespan=[snapshot_lifespan],
        debug=debug_mode,
        **kwargs,
    )
