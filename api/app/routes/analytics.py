"""Analytics API endpoints for RQ metrics."""

from typing import Any
from typing import Optional
from datetime import datetime

from litestar import Controller
from litestar import get
from litestar.di import Provide
from litestar.params import Parameter

from app.db.repository import ManagerRepository
from app.routes.depends import get_repo
from app.schemas.analytics import TimePeriodParams


class AnalyticsController(Controller):
    """Controller for analytics-related endpoints."""

    path = "/analytics"
    tags = ["analytics"]
    dependencies = {"svc": Provide(get_repo)}

    @get("/summary")
    async def get_dashboard_summary(self, svc: ManagerRepository) -> dict[str, Any]:
        """Get summary data for the main dashboard.

        Args:
            svc: Analytics database service dependency.

        Returns:
            dict[str, Any]: Dictionary containing aggregated queue and worker statistics.
        """
        queue_stats = svc.get_queue_stats(hours=1)  # Last hour
        worker_stats = svc.get_worker_stats(hours=1)  # Last hour

        # Aggregate queue data
        total_queued = sum(q['avg_count'] for q in queue_stats if q['status'] == 'queued')
        total_failed = sum(q['avg_count'] for q in queue_stats if q['status'] == 'failed')
        total_finished = sum(q['avg_count'] for q in queue_stats if q['status'] == 'finished')

        # Aggregate worker data
        active_workers = len(worker_stats)
        total_successful = sum(w['avg_successful'] for w in worker_stats)
        total_worker_failed = sum(w['avg_failed'] for w in worker_stats)

        return {
            'queues': {
                'total_queued': int(total_queued),
                'total_failed': int(total_failed),
                'total_finished': int(total_finished),
                'unique_queues': len(set(q['queue_name'] for q in queue_stats)),
            },
            'workers': {
                'active_workers': active_workers,
                'total_successful_jobs': int(total_successful),
                'total_failed_jobs': int(total_worker_failed),
                'avg_working_time': sum(w['avg_working_time'] for w in worker_stats) / max(active_workers, 1),
            },
        }

    @get("/workers")
    async def get_worker_stats(
        self,
        svc: ManagerRepository,
        period: Optional[str] = Parameter(default="24h"),
        start_date: Optional[datetime] = Parameter(default=None),
        end_date: Optional[datetime] = Parameter(default=None),
    ) -> list[dict[str, Any]]:
        """Get worker statistics for the specified time period.

        Args:
            svc: Analytics database service dependency.
            period: Time period identifier (e.g., "24h", "7d").
            start_date: Custom start date for time range.
            end_date: Custom end date for time range.
        """
        filters = TimePeriodParams(period=period, start_date=start_date, end_date=end_date)
        return svc.get_worker_stats(period=filters)

    @get("/workers/throughput")
    async def get_worker_throughput(
        self,
        svc: ManagerRepository,
        period: Optional[str] = Parameter(default="5m"),
        start_date: Optional[datetime] = Parameter(default=None),
        end_date: Optional[datetime] = Parameter(default=None),
        granularity: Optional[str] = Parameter(default="10s"),
    ) -> list[dict[str, Any]]:
        """Get worker throughput data for the specified time period.

        Args:
            svc (ManagerRepository): Analytics database service dependency.
            period (Optional[str]): Time period identifier (e.g., "24h", "7d").
            start_date (Optional[datetime]): Custom start date for time range.
            end_date (Optional[datetime]): Custom end date for time range.

        Returns:
            list[dict[str, Any]]: List of worker throughput metrics.
        """
        filters = TimePeriodParams(period=period, start_date=start_date, end_date=end_date, granularity=granularity)
        return svc.get_worker_throughput(period=filters)

    @get("/queues")
    async def get_queue_stats(
        self,
        svc: ManagerRepository,
        period: Optional[str] = Parameter(default="24h"),
        start_date: Optional[datetime] = Parameter(default=None),
        end_date: Optional[datetime] = Parameter(default=None),
    ) -> list[dict[str, Any]]:
        """Get queue statistics for the specified time period.

        Args:
            svc: Analytics database service dependency.
            period: period time period (e.g., "24h", "7d").
            start_date: Custom start date for time range.
            end_date: Custom end date for time range.

        Returns:
            list[dict[str, Any]]: List of queue statistics including status counts.
        """
        filters = TimePeriodParams(period=period, start_date=start_date, end_date=end_date)
        return svc.get_queue_stats(period=filters)

    @get("/queues/depth")
    async def get_queue_depth(
        self,
        svc: ManagerRepository,
        period: Optional[str] = Parameter(default="5m"),
        start_date: Optional[datetime] = Parameter(default=None),
        end_date: Optional[datetime] = Parameter(default=None),
        granularity: Optional[str] = Parameter(default="1s"),
    ) -> list[dict[str, Any]]:
        """Get queue depth statistics for the specified time period.

        Args:
            svc (ManagerRepository): Analytics database service dependency.
            period (Optional[str]): Time period identifier (e.g., "24h", "7d").
            start_date (Optional[datetime]): Custom start date for time range.
            end_date (Optional[datetime]): Custom end date for time range.

        Returns:
            list[dict[str, Any]]: List containing queue depth statistics.
        """
        filters = TimePeriodParams(period=period, start_date=start_date, end_date=end_date, granularity=granularity)
        return svc.get_queue_depth(period=filters)
