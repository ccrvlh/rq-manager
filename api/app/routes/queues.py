"""Queues routes and controller."""

import logging

from typing import Optional

from litestar import get
from litestar import post
from litestar import delete
from litestar.response import Response
from litestar.controller import Controller
from litestar.status_codes import HTTP_200_OK
from litestar.status_codes import HTTP_201_CREATED
from litestar.status_codes import HTTP_404_NOT_FOUND
from litestar.status_codes import HTTP_400_BAD_REQUEST
from litestar.status_codes import HTTP_500_INTERNAL_SERVER_ERROR

from app.routes.depends import get_queue_service_dependency
from app.schemas.queues import QueueCreate
from app.schemas.queues import QueueStatus
from app.schemas.queues import QueuePriority
from app.schemas.queues import QueueListFilters
from app.schemas.queues import QueueBulkOperation
from app.services.queues import QueueService


logger = logging.getLogger(__name__)


class QueuesController(Controller):
    """Controller for queue-related endpoints.

    Provides endpoints to list, create, fetch, update, and delete queues.

    Attributes:
        path (str): Base path for the queue endpoints.
        tags (list[str]): Tags applied to the routes for API documentation.
        dependencies (dict): Dependency injection definitions for the routes.
    """

    path = "/queues"
    tags = ["queues"]

    dependencies = {"svc": get_queue_service_dependency}

    @get()
    async def list_queues(
        self,
        svc: QueueService,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        limit: Optional[int] = 50,
        offset: Optional[int] = 0,
    ) -> Response:
        """List all queues with optional filtering.

        Args:
            svc (QueueService): The queue service instance.
            status (Optional[str]): Optional filter by queue status.
            priority (Optional[str]): Optional filter by queue priority.
            search (Optional[str]): Optional search string.
            limit (Optional[int]): Max number of queues to return. Defaults to 50.
            offset (Optional[int]): Pagination offset. Defaults to 0.

        Returns:
            Response: Response containing list of queues or error details.
        """
        try:
            filters = QueueListFilters(
                status=QueueStatus(status) if status else None,
                priority=QueuePriority(priority) if priority else None,
                search=search,
                limit=limit,
                offset=offset,
            )

            queues = await svc.list_queues(filters)

            return Response(content={"data": queues}, status_code=HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error listing queues: {e}")
            return Response(
                content={"error": "Failed to list queues", "details": str(e)}, status_code=HTTP_500_INTERNAL_SERVER_ERROR
            )

    @post()
    async def create_queue(self, svc: QueueService, data: QueueCreate) -> Response:
        """Create a new queue.

        Args:
            svc (QueueService): The queue service instance.
            data (QueueCreate): The payload for creating a queue.

        Returns:
            Response: Response containing the created queue or error details.
        """
        try:
            queue = await svc.create_queue(data)

            return Response(content={"data": queue}, status_code=HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating queue: {e}")
            return Response(
                content={"error": "Failed to create queue", "details": str(e)}, status_code=HTTP_500_INTERNAL_SERVER_ERROR
            )

    @get("/{queue_name:str}")
    async def get_queue(self, svc: QueueService, queue_name: str) -> Response:
        """Retrieve a specific queue by its name.

        Args:
            svc (QueueService): The queue service instance.
            queue_name (str): The name of the queue.

        Returns:
            Response: Response containing the queue data or error message if not found.
        """
        try:
            queue = await svc.get_queue(queue_name)

            if not queue:
                return Response(content={"error": "Queue not found"}, status_code=HTTP_404_NOT_FOUND)

            return Response(content={"data": queue}, status_code=HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting queue {queue_name}: {e}")
            return Response(
                content={"error": "Failed to get queue", "details": str(e)}, status_code=HTTP_500_INTERNAL_SERVER_ERROR
            )

    @delete("/{queue_name:str}")
    async def delete_queue(self, svc: QueueService, queue_name: str) -> None:
        """Delete a queue."""
        try:
            success = await svc.delete_queue(queue_name)

            if success:
                return None
            else:
                raise Exception("Failed to delete queue")

        except Exception as e:
            logger.error(f"Error deleting queue {queue_name}: {e}")
            raise Exception("Failed to delete queue")

    @post("/{queue_name:str}/empty")
    async def empty_queue(self, svc: QueueService, queue_name: str) -> Response:
        """Empty all jobs from a queue."""
        try:
            success = await svc.empty_queue(queue_name)

            if success:
                return Response(content={"message": f"Queue {queue_name} emptied successfully"}, status_code=HTTP_200_OK)
            else:
                return Response(content={"error": "Failed to empty queue"}, status_code=HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Error emptying queue {queue_name}: {e}")
            return Response(
                content={"error": "Failed to empty queue", "details": str(e)}, status_code=HTTP_500_INTERNAL_SERVER_ERROR
            )

    @get("/{queue_name:str}/metrics")
    async def get_queue_metrics(self, svc: QueueService, queue_name: str) -> Response:
        """Get metrics for a specific queue."""
        try:
            metrics = await svc.get_queue_metrics(queue_name)

            return Response(content={"data": metrics}, status_code=HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting metrics for queue {queue_name}: {e}")
            return Response(
                content={"error": "Failed to get metrics", "details": str(e)}, status_code=HTTP_500_INTERNAL_SERVER_ERROR
            )

    @get("/{queue_name:str}/health")
    async def get_queue_health(self, svc: QueueService, queue_name: str) -> Response:
        """Check health status of a queue."""
        try:
            health = await svc.get_queue_health(queue_name)

            return Response(content={"data": health}, status_code=HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error checking health for queue {queue_name}: {e}")
            return Response(
                content={"error": "Failed to check queue health", "details": str(e)}, status_code=HTTP_500_INTERNAL_SERVER_ERROR
            )

    @post("/bulk")
    async def bulk_queue_operation(
        self, svc: QueueService, operation: str, queue_names: list[str], reason: Optional[str] = None
    ) -> Response:
        """Perform bulk operations on queues."""
        try:
            allowed_operations = {"delete", "empty", "pause", "resume"}

            if operation not in allowed_operations:
                return Response(
                    content={"error": f"Invalid operation. Allowed: {allowed_operations}"}, status_code=HTTP_400_BAD_REQUEST
                )

            bulk_operation = QueueBulkOperation(queue_names=queue_names, operation=operation, reason=reason)

            results = await svc.bulk_queue_operation(queue_names=bulk_operation.queue_names, operation=bulk_operation.operation)

            return Response(content={"data": results}, status_code=HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error performing bulk operation: {e}")
            return Response(
                content={"error": "Failed to perform bulk operation", "details": str(e)},
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            )
