"""Jobs routes and controller."""

from typing import Optional

from litestar import Controller
from litestar import get
from litestar import post
from litestar import patch
from litestar import delete
from litestar.di import Provide
from litestar.params import Parameter
from litestar.exceptions import HTTPException
from litestar.status_codes import HTTP_404_NOT_FOUND
from litestar.status_codes import HTTP_204_NO_CONTENT
from litestar.status_codes import HTTP_400_BAD_REQUEST
from litestar.status_codes import HTTP_500_INTERNAL_SERVER_ERROR

from app.schemas.jobs import JobCreate
from app.schemas.jobs import JobStatus
from app.schemas.jobs import JobUpdate
from app.schemas.jobs import JobDetails
from app.schemas.jobs import JobListFilters
from app.schemas.jobs import JobBulkOperation
from app.services.jobs import JobService
from app.routes.depends import get_job_service_dependency


class JobsController(Controller):
    """Controller for job-related endpoints.

    Provides CRUD operations for jobs including listing, creating,
    fetching by ID, updating, and deleting jobs.

    Attributes:
        path (str): The base path for job endpoints.
        tags (list[str]): Tags applied to the job routes for API documentation.
        dependencies (dict): Service dependencies injected into endpoints.
    """

    path = "/jobs"
    tags = ["jobs"]
    dependencies = {"svc": Provide(get_job_service_dependency)}

    @get()
    async def list_jobs(
        self,
        svc: JobService,
        queue: Optional[str] = Parameter(default=None, query="queue"),
        status: Optional[str] = Parameter(default=None, query="status"),
        worker: Optional[str] = Parameter(default=None, query="worker"),
        function: Optional[str] = Parameter(default=None, query="function"),
        search: Optional[str] = Parameter(default=None, query="search"),
        limit: int = Parameter(default=50, query="limit"),
        offset: int = Parameter(default=0, query="offset"),
    ) -> dict:
        """List jobs with optional filtering.

        Args:
            svc (JobService): The service handling job logic.
            queue (Optional[str]): Filter by queue name.
            status (Optional[str]): Filter by status string.
            worker (Optional[str]): Filter by worker name.
            function (Optional[str]): Filter by function name.
            search (Optional[str]): Substring search in job details.
            limit (int): Pagination limit (default 50).
            offset (int): Pagination offset (default 0).

        Returns:
            dict: Dictionary with paginated list of jobs and metadata.
        """
        try:
            # Convert string status to JobStatus enum
            job_status = None
            if status:
                try:
                    job_status = JobStatus(status.lower())
                except ValueError:
                    raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"Invalid status: {status}")

            filters = JobListFilters(
                queue=queue,
                status=job_status,
                worker=worker,
                function=function,
                search=search,
                limit=limit,
                offset=offset,
            )
            jobs, total_count = svc.list_jobs(filters)

            return {"data": jobs, "total": total_count, "offset": offset, "limit": limit, "has_more": len(jobs) == limit}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @post()
    async def create_job(self, svc: JobService, data: JobCreate) -> dict:
        """Create a new job.

        Args:
            svc (JobService): The job service instance.
            data (JobCreate): The job creation payload.

        Returns:
            dict: The created job details as a dictionary.

        Raises:
            HTTPException: If the job creation fails.
        """
        try:
            job = svc.create_job(data)
            if not job:
                raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Failed to create job")
            return job.to_dict() if hasattr(job, "to_dict") else dict(job)

        except ValueError as e:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @get("/{job_id:str}")
    async def get_job(self, svc: JobService, job_id: str) -> JobDetails:
        """Retrieve a specific job by its ID.

        Args:
            svc (JobService): The job service instance.
            job_id (str): The ID of the job.

        Returns:
            JobDetails: Details of the requested job.

        Raises:
            HTTPException: If the job ID is not found.
        """
        try:
            job = svc.get_job(job_id)
            if not job:
                raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
            return job
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @patch("/{job_id:str}")
    async def update_job(self, svc: JobService, job_id: str, data: JobUpdate) -> JobDetails:
        """Update a job."""
        try:
            job = svc.update_job(job_id, data)
            if not job:
                raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
            return job
        except ValueError as e:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @delete("/{job_id:str}", status_code=HTTP_204_NO_CONTENT)
    async def delete_job(self, svc: JobService, job_id: str) -> None:
        """Delete a job."""
        try:
            success = svc.delete_job(job_id)
            if not success:
                raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @post("/{job_id:str}/retry")
    async def retry_job(self, svc: JobService, job_id: str) -> dict[str, str]:
        """Retry a failed job."""
        try:
            success = svc.retry_job(job_id)
            if not success:
                raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
            return {"message": f"Job {job_id} retried successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @post("/{job_id:str}/cancel")
    async def cancel_job(self, svc: JobService, job_id: str) -> dict[str, str]:
        """Cancel a running job."""
        try:
            success = svc.cancel_job(job_id)
            if not success:
                raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")
            return {"message": f"Job {job_id} cancelled successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @get("/counts")
    async def get_job_counts(self, svc: JobService) -> dict[str, int]:
        """Get counts of jobs by status."""
        try:
            return svc.get_job_counts()
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @post("/bulk/operations")
    async def perform_bulk_operations(self, svc: JobService, data: JobBulkOperation) -> dict[str, list[str]]:
        """Perform bulk operations on jobs."""
        try:
            results: dict[str, list] = {"successful": [], "failed": []}

            for job_id in data.job_ids:
                try:
                    if data.operation == "cancel":
                        success = svc.cancel_job(job_id)
                    elif data.operation == "delete":
                        success = svc.delete_job(job_id)
                    elif data.operation == "retry":
                        success = svc.retry_job(job_id)
                    else:
                        raise ValueError(f"Unsupported operation: {data.operation}")

                    if success:
                        results["successful"].append(job_id)
                    else:
                        results["failed"].append(job_id)
                except Exception:
                    results["failed"].append(job_id)

            return results
        except ValueError as e:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @get("/functions")
    async def get_job_functions(self, svc: JobService) -> list[str]:
        """Get list of unique function names from all jobs."""
        try:
            jobs, _ = svc.list_jobs()
            functions = set()
            for job in jobs:
                if job.func_name:
                    functions.add(job.func_name)
            return sorted(list(functions))
        except Exception as e:
            raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
