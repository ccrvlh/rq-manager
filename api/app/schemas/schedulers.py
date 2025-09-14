"""Scheduler schemas."""

from typing import Optional
from datetime import datetime

from msgspec import Struct


class SchedulerDetails(Struct):
    """Scheduler details schema."""

    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    hostname: Optional[str] = None
    pid: Optional[int] = None
    status: str = "unknown"
    birth_date: Optional[datetime] = None
    last_heartbeat: Optional[datetime] = None
    scheduled_jobs_count: int = 0


class SchedulerCounts(Struct):
    """Scheduler counts schema."""

    total: int = 0
    active: int = 0
    inactive: int = 0
