"""Workers routes and controller."""

from litestar import Controller
from litestar import get
from litestar import put
from litestar import delete
from litestar.di import Provide
from litestar.exceptions import NotFoundException

from app.schemas.jobs import JobDetails
from app.services.jobs import JobService
from app.routes.depends import get_job_service_dependency
from app.routes.depends import get_worker_service_dependency
from app.schemas.workers import WorkerCounts
from app.schemas.workers import WorkerStatus
from app.schemas.workers import WorkerDetails
from app.schemas.workers import WorkerListFilters
from app.services.workers import WorkerService


class WorkersController(Controller):
    """Controller for worker-related endpoints.

    Provides endpoints to list, create, update, and retrieve worker details,
    as well as to compute worker statistics.

    Attributes:
        path (str): Base path for worker endpoints.
        tags (list[str]): Tags applied for API docs.
        dependencies (dict): Injected services for worker and job management.
    """

    path = "/workers"
    tags = ["workers"]

    dependencies = {"svc": Provide(get_worker_service_dependency), "job_svc": Provide(get_job_service_dependency)}

    @get()
    async def list_workers(
        self,
        svc: WorkerService,
        offset: int = 0,
        limit: int = 50,
        status: str | None = None,
        queues: str | None = None,
        hostname: str | None = None,
        search: str | None = None,
        healthy_only: bool = False,
        active_only: bool = False,
        include_dead: bool = True,
    ) -> list[WorkerDetails]:
        """List all workers with optional filtering and pagination.

        Args:
            svc (WorkerService): Worker service to query worker information.
            offset (int): Offset for pagination (default 0).
            limit (int): Limit for pagination (default 50).
            status (str | None): Optional status filter.
            queues (str | None): Optional comma-separated list of queues.
            hostname (str | None): Optional hostname to filter workers.
            search (str | None): Optional search term.
            healthy_only (bool): Filter only healthy workers.
            active_only (bool): Filter only active (non-dead) workers.
            include_dead (bool): Whether to include dead workers.

        Returns:
            list[WorkerDetails]: Paginated list of workers.
        """
        filters = WorkerListFilters(offset=offset, limit=limit, healthy_only=healthy_only, active_only=active_only)
        if status and hasattr(WorkerStatus, status.upper()):
            filters.status = WorkerStatus(status)

        if hostname:
            filters.hostname = hostname
        if search:
            filters.search = search
        if queues:
            filters.queues = queues.split(",")

        all_workers = svc.list_workers(include_dead=include_dead)
        filtered = []
        for worker in all_workers:
            if filters.status and worker.status.value != status:
                continue
            if filters.hostname and filters.hostname.lower() not in str(worker.hostname or "").lower():
                continue
            if filters.search and not svc._matches_search(worker, filters.search):
                continue
            if filters.healthy_only and not getattr(worker, 'is_healthy', True):
                continue
            if filters.active_only and worker.status == WorkerStatus.DEAD:
                continue
            if queues:
                queue_list = queues.split(",")
                if not any(queue in (worker.queues or []) for queue in queue_list):
                    continue
            filtered.append(worker)

        # Apply pagination
        start = offset
        end = offset + limit
        return filtered[start:end]

    @get("/counts")
    async def get_worker_counts(self, svc: WorkerService) -> WorkerCounts:
        """Get counts of workers by status.

        Args:
            svc (WorkerService): Worker service to compute worker statistics.

        Returns:
            WorkerCounts: An object containing counts for different worker statuses.
        """
        counts = svc.get_worker_counts()
        return WorkerCounts(
            total=counts["total"],
            busy=counts["busy"],
            idle=counts["idle"],
            starting=counts["starting"],
            suspended=counts["suspended"],
            busy_long=counts["busy_long"],
            dead=counts["dead"],
        )

    @get("/{worker_id:str}")
    async def get_worker(self, worker_id: str, svc: WorkerService) -> WorkerDetails:
        """Get a specific worker by ID."""
        worker = svc.get_worker(worker_id)
        if not worker:
            raise NotFoundException(detail=f"Worker {worker_id} not found")
        return worker

    @put("/{worker_id:str}")
    async def update_worker(self, worker_id: str, svc: WorkerService) -> dict:
        """Update a worker (placeholder - requires actual worker updates)."""
        return {"message": f"Worker update endpoint placeholder for {worker_id}", "status": "not_implemented"}

    @delete("/{worker_id:str}")
    async def delete_worker(self, worker_id: str, svc: WorkerService) -> None:
        """Delete a worker (placeholder - requires actual worker deletion)."""
        return None

    @get("/{worker_id:str}/jobs")
    async def get_worker_jobs(self, worker_id: str, svc: WorkerService, job_svc: JobService) -> list[JobDetails]:
        """Get all jobs associated with a specific worker."""
        worker = svc.get_worker(worker_id)
        if not worker:
            raise NotFoundException(detail=f"Worker {worker_id} not found")

        return job_svc.get_jobs_for_worker(worker_id)
