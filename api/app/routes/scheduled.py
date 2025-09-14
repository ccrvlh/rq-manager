"""Scheduled jobs routes and controller."""

from litestar import Controller
from litestar import get
from litestar import delete
from litestar.di import Provide
from litestar.params import Parameter
from litestar.exceptions import HTTPException
from litestar.status_codes import HTTP_404_NOT_FOUND
from litestar.status_codes import HTTP_204_NO_CONTENT
from litestar.status_codes import HTTP_500_INTERNAL_SERVER_ERROR

from app.routes.depends import get_scheduled_job_service_dependency
from app.services.scheduled import ScheduledJobService


class ScheduledJobsController(Controller):
    """Controller for scheduled job-related endpoints.

    Provides endpoints for listing, retrieving counts, and deleting
    scheduled jobs.

    Attributes:
        path (str): Base path for scheduled job endpoints.
        tags (list[str]): API documentation tags for scheduled job routes.
        dependencies (dict): Dependency injection for scheduled job services.
    """

    path = "/scheduled"
    tags = ["scheduled"]
    dependencies = {"svc": Provide(get_scheduled_job_service_dependency)}

    @get()
    async def list_scheduled_jobs(
        self,
        svc: ScheduledJobService,
        limit: int = Parameter(default=50, query="limit"),
        offset: int = Parameter(default=0, query="offset"),
    ) -> dict:
        """List all scheduled jobs.

        Args:
            svc (ScheduledJobService): Service handling scheduled jobs.
            limit (int): Pagination limit, defaults to 50.
            offset (int): Pagination offset, defaults to 0.

        Returns:
            dict: Dictionary containing list of jobs, total count, and pagination metadata.
        """
        try:
            jobs, total_count = svc.list_scheduled_jobs(limit=limit, offset=offset)
            return {
                "data": jobs,
                "total": total_count,
                "offset": offset,
                "limit": limit,
                "has_more": len(jobs) == limit,
            }
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @get("/counts")
    async def get_scheduled_job_counts(self, svc: ScheduledJobService) -> dict[str, int]:
        """Retrieve counts of scheduled jobs grouped by type or status.

        Args:
            svc (ScheduledJobService): Service handling scheduled jobs.

        Returns:
            dict[str, int]: A dictionary mapping job categories to their counts.
        """
        try:
            return svc.get_scheduled_job_counts()
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @delete("/{job_id:str}", status_code=HTTP_204_NO_CONTENT)
    async def delete_scheduled_job(self, svc: ScheduledJobService, job_id: str) -> None:
        """Delete a scheduled job by its ID.

        Args:
            svc (ScheduledJobService): Service handling scheduled jobs.
            job_id (str): Identifier of the scheduled job to delete.

        Raises:
            HTTPException: If the job does not exist or deletion fails.
        """
        try:
            success = svc.delete_scheduled_job(job_id)
            if not success:
                raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Scheduled job {job_id} not found")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
