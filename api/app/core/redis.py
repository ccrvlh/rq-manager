"""Centralized Redis connection manager."""

import logging

from typing import Any
from typing import Optional

import redis

from app.config import settings


logger = logging.getLogger(__name__)


class RedisManager:
    """Centralized Redis connection manager."""

    _instance: Optional["RedisManager"] = None
    _connection: Optional[redis.Redis] = None

    def __new__(cls) -> "RedisManager":
        """Create and return the singleton instance of RedisManager.

        Returns:
            RedisManager: The singleton instance of the Redis connection manager.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_connection(self) -> redis.Redis:
        """Get or create Redis connection.

        Returns:
            redis.Redis: The Redis connection instance.
        """
        if self._connection is None:
            self._connection = self._create_connection()
        return self._connection

    def _create_connection(self) -> redis.Redis:
        """Create new Redis connection.

        Creates a Redis connection using either URL format or individual parameters.
        Tests the connection with a ping before returning.

        Returns:
            redis.Redis: The created Redis connection instance.

        Raises:
            Exception: If Redis connection fails.
        """
        try:
            if settings.APP_REDIS_URL:
                conn = redis.from_url(
                    settings.APP_REDIS_URL,
                    socket_timeout=settings.APP_REDIS_TIMEOUT,
                    socket_connect_timeout=settings.APP_REDIS_TIMEOUT,
                )
            else:
                conn = redis.Redis(
                    host=settings.APP_REDIS_HOST,
                    port=settings.APP_REDIS_PORT,
                    db=settings.APP_REDIS_DB,
                    password=settings.APP_REDIS_PASSWORD or None,
                    ssl=settings.APP_REDIS_SSL,
                    socket_timeout=settings.APP_REDIS_TIMEOUT,
                    socket_connect_timeout=settings.APP_REDIS_TIMEOUT,
                )

            # Test connection
            conn.ping()
            logger.info("Redis connection established")
            return conn

        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    def health_check(self) -> dict[str, Any]:
        """Perform Redis health check.

        Checks Redis connectivity, memory usage, connection statistics,
        and database information.

        Returns:
            Dict[str, Any]: A dictionary containing health check results including:
                - status: "healthy" or "unhealthy"
                - ping: boolean indicating connectivity
                - memory: memory usage statistics
                - connections: connection statistics
                - database: database size information
                - version: Redis version
                - uptime_seconds: Redis uptime in seconds

        Note:
            If the health check fails, returns minimal information with
            "unhealthy" status and error details.
        """
        try:
            conn = self.get_connection()
            ping_result = conn.ping()
            info: dict = conn.info()
            memory_used = info.get('used_memory', 0)
            memory_max = info.get('maxmemory', 0)
            memory_usage_percent = (memory_used / memory_max * 100) if memory_max > 0 else 0
            connected_clients = info.get('connected_clients', 0)
            db_size = conn.dbsize()

            return {
                "status": "healthy" if ping_result else "unhealthy",
                "ping": ping_result,
                "memory": {
                    "used_bytes": memory_used,
                    "used_human": self._format_bytes(memory_used),
                    "max_bytes": memory_max,
                    "usage_percent": round(memory_usage_percent, 2),
                },
                "connections": {
                    "connected_clients": connected_clients,
                },
                "database": {
                    "size": db_size,
                },
                "version": info.get('redis_version', 'unknown'),
                "uptime_seconds": info.get('uptime_in_seconds', 0),
            }

        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "ping": False,
            }

    def _format_bytes(self, bytes_value: int) -> str:
        """Format bytes to human readable string.

        Args:
            bytes_value: The number of bytes to format.

        Returns:
            str: Human readable string representation (e.g., "1.5 MB").
        """
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.1f} PB"

    def close(self) -> None:
        """Close Redis connection.

        Cleans up the Redis connection by closing it and setting the
        connection reference to None.
        """
        if self._connection:
            try:
                self._connection.close()
                logger.info("Redis connection closed")
            except Exception as e:
                logger.error(f"Error closing Redis connection: {e}")
            finally:
                self._connection = None


redis_manager = RedisManager()
