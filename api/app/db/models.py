"""SQLite models for RQ analytics storage."""

import datetime as dt

from datetime import datetime

from sqlalchemy import JSON
from sqlalchemy import Float
from sqlalchemy import String
from sqlalchemy import Integer
from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import mapped_column


class Base(DeclarativeBase):
    pass


class QueueSnapshot(Base):
    __tablename__ = "rq_queues_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: dt.datetime.now(dt.UTC), index=True)
    queue_name: Mapped[str] = mapped_column(String(255), index=True)
    queued_jobs: Mapped[int] = mapped_column(Integer, default=0)
    started_jobs: Mapped[int] = mapped_column(Integer, default=0)
    finished_jobs: Mapped[int] = mapped_column(Integer, default=0)
    failed_jobs: Mapped[int] = mapped_column(Integer, default=0)
    deferred_jobs: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_jobs: Mapped[int] = mapped_column(Integer, default=0)


class WorkerSnapshot(Base):
    __tablename__ = "rq_workers_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: dt.datetime.now(dt.UTC), index=True)
    worker_name: Mapped[str] = mapped_column(String(255), index=True)
    state: Mapped[str] = mapped_column(String(50))
    queues: Mapped[list[str]] = mapped_column(JSON)
    successful_jobs: Mapped[int] = mapped_column(Integer, default=0)
    failed_jobs: Mapped[int] = mapped_column(Integer, default=0)
    working_time: Mapped[float] = mapped_column(Float, default=0.0)


## Legacy


class QueueMetric(Base):
    __tablename__ = "queue_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: dt.datetime.now(dt.UTC), index=True)
    queue_name: Mapped[str] = mapped_column(String(255), index=True)
    status: Mapped[str] = mapped_column(String(50), index=True)
    count: Mapped[int] = mapped_column(Integer, default=0)
