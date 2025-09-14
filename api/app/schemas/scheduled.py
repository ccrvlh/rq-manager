"""Scheduled job schemas."""

from typing import Any
from typing import Optional
from datetime import datetime

from msgspec import Struct


class ScheduledJobDetails(Struct):
    """Schema for scheduled job details."""

    id: str
    func_name: str
    args: Optional[list[Any]] = None
    kwargs: Optional[dict[str, Any]] = None
    queue: str = "default"
    scheduled_for: Optional[datetime] = None
    created_at: Optional[datetime] = None
    timeout: Optional[int] = None
    description: Optional[str] = None
    meta: Optional[dict[str, Any]] = None
    cron: Optional[str] = None
    repeat: Optional[int] = None
    interval: Optional[int] = None
