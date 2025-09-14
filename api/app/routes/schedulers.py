"""Schedulers routes and controller."""

from litestar import Controller
from litestar import get
from litestar.di import Provide

from app.routes.depends import get_scheduler_service_dependency
from app.schemas.schedulers import SchedulerCounts
from app.schemas.schedulers import SchedulerDetails
from app.services.schedulers import SchedulerService


class SchedulersController(Controller):
    """Controller for scheduler-related endpoints.

    Provides endpoints for listing and retrieving statistics about
    RQ Scheduler instances.

    Attributes:
        path (str): Base path for scheduler endpoints.
        tags (list[str]): Tags applied to the scheduler routes for API docs.
        dependencies (dict): Service injection mapping for scheduler service.
    """

    path = "/schedulers"
    tags = ["schedulers"]
    dependencies = {"svc": Provide(get_scheduler_service_dependency)}

    @get()
    async def list_schedulers(self, svc: SchedulerService) -> list[SchedulerDetails]:
        """List all RQ Scheduler instances.

        Args:
            svc (SchedulerService): The scheduler service instance.

        Returns:
            list[SchedulerDetails]: A list of scheduler details objects.
        """
        return svc.list_schedulers()

    @get("/counts")
    async def get_scheduler_counts(self, svc: SchedulerService) -> SchedulerCounts:
        """Get counts of schedulers grouped by their status.

        Args:
            svc (SchedulerService): The scheduler service instance.

        Returns:
            SchedulerCounts: Object containing counts of schedulers by status.
        """
        return svc.get_scheduler_counts()
