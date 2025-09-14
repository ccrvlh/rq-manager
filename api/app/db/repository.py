"""Database setup and session management for analytics."""

import json
import logging
import datetime as dt

from typing import Any
from pathlib import Path
from datetime import timedelta

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from .models import Base
from .models import QueueMetric
from .models import QueueSnapshot
from .models import WorkerSnapshot

from app.config import settings
from app.schemas.jobs import JobStatus
from app.schemas.analytics import TimePeriodParams


logger = logging.getLogger(__name__)


class ManagerRepository:
    def __init__(self, db_path: str | None = None):
        """Initialize the AnalyticsDB with SQLite database.

        Args:
            db_path: Path to the SQLite database file. If None, uses the
                    path from settings or defaults to "data/analytics.db".
        """
        if db_path is None:
            db_path = settings.APP_ANALYTICS_DB_PATH or "data/analytics.db"

        # Ensure directory exists
        db_file = Path(db_path)
        db_file.parent.mkdir(parents=True, exist_ok=True)

        self.engine = create_engine(f"sqlite:///{db_path}", echo=False, pool_pre_ping=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def get_session(self) -> Session:
        """Get a new database session.

        Returns:
            Session: A new SQLAlchemy session for database operations.
        """
        return self.SessionLocal()

    def store_worker_snapshot(self, workers_data: list[dict[str, Any]]) -> None:
        """Store worker metrics from collector data.

        Args:
            workers_data: List of worker data dictionaries containing metrics
                         such as name, state, queues, job counts, and working time.
        """
        with self.get_session() as session:
            for worker in workers_data:
                metric = WorkerSnapshot(
                    worker_name=worker['name'],
                    state=worker['state'],
                    queues=json.dumps(worker['queues']),
                    successful_jobs=worker['successful_job_count'],
                    failed_jobs=worker['failed_job_count'],
                    working_time=worker['total_working_time'],
                )
                session.add(metric)
            session.commit()

    def store_queue_snapshot(self, queues_data: dict[str, dict[str, int]]) -> None:
        """Store queue metrics from collector data.

        Args:
            queues_data: Dictionary mapping queue names to their status counts.
                        Each status count is a dictionary of status -> count mappings.
        """
        with self.get_session() as session:
            for queue_name, counts in queues_data.items():
                metric = QueueSnapshot(
                    queue_name=queue_name,
                    queued_jobs=counts.get(JobStatus.QUEUED, 0),
                    started_jobs=counts.get(JobStatus.STARTED, 0),
                    finished_jobs=counts.get(JobStatus.FINISHED, 0),
                    failed_jobs=counts.get(JobStatus.FAILED, 0),
                    deferred_jobs=counts.get(JobStatus.DEFERRED, 0),
                    scheduled_jobs=counts.get(JobStatus.SCHEDULED, 0),
                )
                session.add(metric)
            session.commit()

    def get_queue_stats(self, period: TimePeriodParams | None = None, hours: int | None = None) -> list[dict[str, Any]]:
        """Get queue statistics with optional time period filters.

        Args:
            period: Time period parameters for filtering the data.
            hours: Number of hours to look back if period is not provided.

        Returns:
            list[dict[str, Any]]: List of queue statistics including queue name,
                                  status, and average/min/max counts.
        """
        cutoff = dt.datetime.now(dt.UTC) - timedelta(hours=hours or 24)
        end_time = dt.datetime.now(dt.UTC)
        if period:
            cutoff = period.get_start_datetime()
            end_time = period.end_date if period and period.end_date else dt.datetime.now(dt.UTC)

        with self.get_session() as session:
            query = select(
                QueueMetric.queue_name,
                QueueMetric.status,
                func.avg(QueueMetric.count).label('avg_count'),
                func.max(QueueMetric.count).label('max_count'),
                func.min(QueueMetric.count).label('min_count'),
            ).where(QueueMetric.timestamp >= cutoff)

            if period and period.end_date:
                query = query.where(QueueMetric.timestamp <= end_time)

            result = session.execute(query.group_by(QueueMetric.queue_name, QueueMetric.status)).all()

            return [
                {
                    'queue_name': row.queue_name,
                    'status': row.status,
                    'avg_count': float(row.avg_count),
                    'max_count': row.max_count,
                    'min_count': row.min_count,
                }
                for row in result
            ]

    def get_worker_stats(self, period: TimePeriodParams | None = None, hours: int | None = None) -> list[dict[str, Any]]:
        """Get worker statistics with optional time period filters.

        Args:
            period: Time period parameters for filtering the data.
            hours: Number of hours to look back if period is not provided.

        Returns:
            list[dict[str, Any]]: List of worker statistics including worker name,
                                  data points count, and average performance metrics.
        """
        cutoff = dt.datetime.now(dt.UTC) - timedelta(hours=hours or 24)
        end_time = dt.datetime.now(dt.UTC)
        if period:
            cutoff = period.get_start_datetime()
            end_time = period.end_date if period and period.end_date else dt.datetime.now(dt.UTC)

        with self.get_session() as session:
            query = select(
                WorkerSnapshot.worker_name,
                func.count().label('data_points'),
                func.avg(WorkerSnapshot.successful_jobs).label('avg_successful'),
                func.avg(WorkerSnapshot.failed_jobs).label('avg_failed'),
                func.avg(WorkerSnapshot.working_time).label('avg_working_time'),
            ).where(WorkerSnapshot.timestamp >= cutoff)

            if period and period.end_date:
                query = query.where(WorkerSnapshot.timestamp <= end_time)

            result = session.execute(query.group_by(WorkerSnapshot.worker_name)).all()

            return [
                {
                    'worker_name': row.worker_name,
                    'data_points': row.data_points,
                    'avg_successful': float(row.avg_successful),
                    'avg_failed': float(row.avg_failed),
                    'avg_working_time': float(row.avg_working_time),
                }
                for row in result
            ]

    def get_time_series(
        self, metric_type: str, period: TimePeriodParams | None = None, hours: int | None = None
    ) -> list[dict[str, Any]]:
        """Get time series data for charts with optional time period filters.

        Args:
            metric_type: Type of metric data to retrieve ('queue_jobs' or 'worker_performance').
            period: Time period parameters for filtering the data.
            hours: Number of hours to look back if period is not provided.

        Returns:
            list[dict[str, Any]]: List of time series data points with timestamps
                                  and metric-specific values. Returns empty list for
                                  unsupported metric types.
        """
        cutoff = dt.datetime.now(dt.UTC) - timedelta(hours=hours or 24)
        end_time = dt.datetime.now(dt.UTC)
        if period:
            cutoff = period.get_start_datetime()
            end_time = period.end_date if period and period.end_date else dt.datetime.now(dt.UTC)

        with self.get_session() as session:
            if metric_type == 'queue_jobs':
                return self._get_queue_jobs_time_series(
                    db=session,
                    period=period,
                    cutoff=cutoff,
                    end_time=end_time,
                )

            elif metric_type == 'worker_performance':
                return self._get_worker_performance_time_series(
                    db=session,
                    period=period,
                    cutoff=cutoff,
                    end_time=end_time,
                )

        return []

    def _get_worker_performance_time_series(
        self,
        db: Session,
        period: TimePeriodParams | None = None,
        cutoff: dt.datetime | None = None,
        end_time: dt.datetime | None = None,
    ) -> list[dict[str, Any]]:
        query = select(
            WorkerSnapshot.timestamp,
            WorkerSnapshot.worker_name,
            WorkerSnapshot.successful_jobs,
            WorkerSnapshot.failed_jobs,
            WorkerSnapshot.working_time,
        ).where(WorkerSnapshot.timestamp >= cutoff)

        if period and period.end_date:
            query = query.where(WorkerSnapshot.timestamp <= end_time)

        result = db.execute(query.order_by(WorkerSnapshot.timestamp)).all()
        return [
            {
                'timestamp': row.timestamp.isoformat(),
                'worker_name': row.worker_name,
                'successful_jobs': row.successful_jobs,
                'failed_jobs': row.failed_jobs,
                'working_time': row.working_time,
            }
            for row in result
        ]

    def _get_queue_jobs_time_series(
        self,
        db: Session,
        period: TimePeriodParams | None = None,
        cutoff: dt.datetime | None = None,
        end_time: dt.datetime | None = None,
    ) -> list[dict[str, Any]]:
        query = select(QueueMetric.timestamp, QueueMetric.queue_name, QueueMetric.status, QueueMetric.count).where(
            QueueMetric.timestamp >= cutoff
        )
        if period and period.end_date:
            query = query.where(QueueMetric.timestamp <= end_time)

        result = db.execute(query.order_by(QueueMetric.timestamp)).all()
        return [
            {
                'timestamp': row.timestamp.isoformat(),
                'queue_name': row.queue_name,
                'status': row.status,
                'count': row.count,
            }
            for row in result
        ]

    def get_worker_throughput(self, period: TimePeriodParams | None = None, hours: int | None = None) -> list[dict[str, Any]]:
        """Get worker throughput data as number of jobs processed (successful+failed) per worker over time intervals."""
        WS = WorkerSnapshot
        now = dt.datetime.now(dt.timezone.utc)
        if period:
            since = now - period.get_timedelta()
            fmt = period.get_granularity_format()
        else:
            since = now - dt.timedelta(minutes=5)
            fmt = "%Y-%m-%d %H:%M:%S"

        session = self.get_session()
        jobs_expr = WS.successful_jobs + WS.failed_jobs
        raw_delta = jobs_expr - func.lag(jobs_expr).over(partition_by=WS.worker_name, order_by=WS.timestamp)
        delta_expr = func.max(raw_delta, 0)

        subq = (
            select(
                WS.worker_name.label("worker_name"),
                WS.timestamp.label("ts"),
                delta_expr.label("delta"),
            )
            .where(WS.timestamp >= since)
            .subquery()
        )

        bucket_col = func.strftime(fmt, subq.c.ts).label("bucket")

        stmt = (
            select(
                subq.c.worker_name,
                bucket_col,
                func.coalesce(func.avg(subq.c.delta), 0).label("throughput"),
            )
            .group_by(subq.c.worker_name, bucket_col)
            .order_by(bucket_col)
        )

        rows = session.execute(stmt).all()
        return [
            {
                "timestamp": row.bucket,
                "worker_name": row.worker_name,
                "throughput": float(row.throughput) if row.throughput is not None else 0.0,
            }
            for row in rows
        ]

    def get_queue_depth(self, period: TimePeriodParams | None = None, hours: int | None = None) -> list[dict[str, Any]]:
        """Get queue evolution data formatted for time series charts with optional time period filters.

        Args:
            period: Time period parameters for filtering the data.
            hours: Number of hours to look back if period is not provided.

        Returns:
            list[dict[str, Any]]: List of time points with queue evolution data,
                                  grouped by timestamp and containing counts for
                                  each queue and status combination.
        """
        QS = QueueSnapshot
        now = dt.datetime.now(dt.timezone.utc)
        if period:
            since = now - period.get_timedelta()
            fmt = period.get_granularity_format()
        else:
            since = now - dt.timedelta(minutes=5)
            fmt = "%Y-%m-%d %H:%M:%S"

        session = self.get_session()
        bucket_col = func.strftime(fmt, QS.timestamp).label("bucket")

        rn = func.row_number().over(partition_by=(QS.queue_name, bucket_col), order_by=QS.timestamp.desc()).label("rn")

        subq = select(
            QS.queue_name,
            bucket_col,
            QS.queued_jobs,
            QS.started_jobs,
            QS.finished_jobs,
            QS.failed_jobs,
            QS.deferred_jobs,
            QS.scheduled_jobs,
            QS.timestamp,
            rn,
        ).where(QS.timestamp >= since)

        subq = subq.subquery()

        stmt = (
            select(
                subq.c.queue_name,
                subq.c.bucket,
                subq.c.queued_jobs,
                subq.c.started_jobs,
                subq.c.finished_jobs,
                subq.c.failed_jobs,
                subq.c.deferred_jobs,
                subq.c.scheduled_jobs,
                subq.c.timestamp,
            )
            .where(subq.c.rn == 1)
            .order_by(subq.c.queue_name, subq.c.bucket)
        )

        res = session.execute(stmt).all()
        return [
            {
                "timestamp": row.bucket,
                "queue_name": row.queue_name,
                "queued_jobs": row.queued_jobs,
                "started_jobs": row.started_jobs,
                "finished_jobs": row.finished_jobs,
                "failed_jobs": row.failed_jobs,
                "deferred_jobs": row.deferred_jobs,
                "scheduled_jobs": row.scheduled_jobs,
            }
            for row in res
        ]

    def cleanup_old_data(self, retention_days: int) -> dict[str, int]:
        """Remove data older than retention_days and return cleanup stats.

        Args:
            retention_days: Number of days to retain data. Older data will be deleted.

        Returns:
            dict[str, int]: Dictionary containing cleanup statistics with keys:
                           - 'worker_metrics_deleted': Count of deleted worker metrics
                           - 'queue_metrics_deleted': Count of deleted queue metrics
                           - 'total_deleted': Total count of deleted records
        """
        cutoff = dt.datetime.now(dt.UTC) - timedelta(days=retention_days)

        with self.get_session() as session:
            try:
                worker_count = session.query(WorkerSnapshot).filter(WorkerSnapshot.timestamp < cutoff).count()
                queue_count = session.query(QueueMetric).filter(QueueMetric.timestamp < cutoff).count()

                worker_delete_result = session.query(WorkerSnapshot).filter(WorkerSnapshot.timestamp < cutoff).delete()
                queue_delete_result = session.query(QueueMetric).filter(QueueMetric.timestamp < cutoff).delete()

                session.commit()

                if worker_delete_result != worker_count or queue_delete_result != queue_count:
                    logger.warning(
                        f"Deletion count mismatch: workers={worker_delete_result}/{worker_count}, queues={queue_delete_result}/{queue_count}"
                    )

            except Exception as e:
                session.rollback()
                logger.error(f"Error during cleanup: {e}")
                raise

            return {
                'worker_metrics_deleted': worker_count,
                'queue_metrics_deleted': queue_count,
                'total_deleted': worker_count + queue_count,
            }
