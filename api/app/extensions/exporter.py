"""Prometheus metrics collector for RQ."""

import logging

from prometheus_client.core import GaugeMetricFamily
from prometheus_client.core import CounterMetricFamily
from prometheus_client.registry import Collector

from ..services.snapshots import SnapshotService


logger = logging.getLogger(__name__)


class PrometheusExporter(Collector):
    """Exports RQ metrics to Prometheus format.

    This class implements a Prometheus-compatible exporter that
    collects runtime statistics from RQ (Redis Queue) such as
    worker states, job counts, and job performance metrics.

    Attributes:
        collector (SnapshotService): A service that provides
            snapshot data for workers and queues.
    """

    def __init__(self, collector: SnapshotService):
        """Initialize PrometheusExporter with the given collector service.

        Args:
            collector (SnapshotService): The snapshot service responsible
                for retrieving queue and worker metrics.
        """
        self.collector = collector

    def collect(self):
        """Collect RQ Metrics and expose them as Prometheus metrics.

        Returns:
            Iterator[GaugeMetricFamily | CounterMetricFamily]:
                Generator yielding metric families including job counts,
                worker status, success/failure counts, and working times.
        """
        logger.debug('Collecting the RQ metrics...')

        rq_jobs = GaugeMetricFamily('rq_jobs', 'RQ jobs by state', labels=['queue', 'status'])
        rq_workers = GaugeMetricFamily('rq_workers', 'RQ workers', labels=['name', 'state', 'queues'])
        rq_workers_success = CounterMetricFamily('rq_workers_success', 'RQ workers success count', labels=['name', 'queues'])
        rq_workers_failed = CounterMetricFamily('rq_workers_failed', 'RQ workers fail count', labels=['name', 'queues'])
        rq_workers_working_time = CounterMetricFamily(
            'rq_workers_working_time', 'RQ workers spent seconds', labels=['name', 'queues']
        )

        workers = self.collector.get_workers_snapshot()
        for worker in workers:
            label_queues = ','.join(worker['queues'])
            rq_workers.add_metric([worker['name'], worker['state'], label_queues], 1)
            rq_workers_success.add_metric([worker['name'], label_queues], worker['successful_job_count'])
            rq_workers_failed.add_metric([worker['name'], label_queues], worker['failed_job_count'])
            rq_workers_working_time.add_metric([worker['name'], label_queues], worker['total_working_time'])

        yield rq_workers
        yield rq_workers_success
        yield rq_workers_failed
        yield rq_workers_working_time

        for queue_name, jobs in self.collector.get_all_queues_snapshot().items():
            for status, count in jobs.items():
                rq_jobs.add_metric([queue_name, status], count)

        yield rq_jobs
        logger.debug('RQ metrics collection finished')
