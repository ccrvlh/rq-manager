"""Health check routes."""

from typing import Any

from litestar import Controller
from litestar import get

from app.core.redis import redis_manager


class HealthController(Controller):
    """Health check controller for monitoring system health.

    Provides endpoints for checking the health of the system and
    its critical dependencies (such as Redis).

    Attributes:
        path (str): The base path for the health endpoints.
    """

    path = "/health"

    @get("/")
    async def health_check(self) -> dict[str, Any]:
        """General health check endpoint.

        Returns:
            dict[str, Any]: Health status including overall system status and
            individual service health details.
        """
        redis_health = redis_manager.health_check()

        return {
            "status": "healthy" if redis_health["status"] == "healthy" else "unhealthy",
            "services": {
                "redis": redis_health,
            },
        }

    @get("/redis")
    async def redis_health(self) -> dict[str, Any]:
        """Perform Redis-specific health check.

        Returns:
            dict[str, Any]: Redis health status including connectivity, memory,
            connection stats, and version information.
        """
        return redis_manager.health_check()
