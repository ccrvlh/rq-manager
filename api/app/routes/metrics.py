"""Prometheus metrics endpoint for RQ monitoring."""

from litestar import Controller
from litestar import get
from litestar.di import Provide
from litestar.response import Response
from prometheus_client import REGISTRY
from prometheus_client import generate_latest

from app.routes.depends import get_metrics_service_dependency
from app.services.snapshots import SnapshotService
from app.extensions.exporter import PrometheusExporter


class MetricsController(Controller):
    """Controller for serving Prometheus metrics endpoints.

    Provides the `/metrics` endpoint that exposes Prometheus-formatted
    statistics for monitoring RQ system health and performance.

    Attributes:
        path (str): Base path for the metrics endpoints.
        tags (list[str]): Metadata tags for API documentation.
        dependencies (dict): The injected dependencies for metrics service.
    """

    path = "/metrics"
    tags = ["metrics"]
    dependencies = {"svc": Provide(get_metrics_service_dependency)}

    @get()
    async def prometheus_metrics(self, svc: SnapshotService) -> Response:
        """Serve Prometheus metrics endpoint.

        Args:
            svc (SnapshotService): The snapshot service used to collect RQ data.

        Returns:
            Response: HTTP response containing Prometheus-formatted metrics data.

        Raises:
            Exception: If metrics generation fails.

        Note:
            This endpoint temporarily registers the exporter with the
            Prometheus REGISTRY, generates metrics, and ensures cleanup
            by unregistering the exporter to prevent memory leaks.
        """
        try:
            exporter = PrometheusExporter(svc)
            REGISTRY.register(exporter)

            try:
                metrics_data = generate_latest(REGISTRY)
            finally:
                REGISTRY.unregister(exporter)

            return Response(content=metrics_data, media_type="text/plain; version=0.0.4; charset=utf-8")
        except Exception as e:
            return Response(content=f"# Error generating metrics: {str(e)}\n", media_type="text/plain", status_code=500)
