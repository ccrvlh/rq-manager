"""RQ Job Schemas - Represents jobs in the queue."""

from enum import Enum
from typing import Any
from typing import Optional
from datetime import datetime

from msgspec import Struct


class JobStatus(str, Enum):
    """Job status enumeration matching RQ job states."""

    QUEUED = "queued"
    STARTED = "started"
    FINISHED = "finished"
    FAILED = "failed"
    DEFERRED = "deferred"
    SCHEDULED = "scheduled"
    STOPPED = "stopped"
    CANCELED = "canceled"


class JobDependency(Struct):
    """Schema for job dependencies."""

    job_id: str
    result_key: Optional[str] = None
    allow_failure: bool = False


class JobMetaData(Struct):
    """Schema for job metadata stored in RQ."""

    timeout: Optional[int] = None
    result_ttl: Optional[int] = None
    ttl: Optional[int] = None
    failure_ttl: Optional[int] = None
    max_retries: Optional[int] = None
    retry_interval: Optional[int] = None
    retry_backoff: Optional[float] = None
    retry_backoff_max: Optional[int] = None
    description: Optional[str] = None
    depends_on: Optional[list[str]] = None
    queue_name: Optional[str] = None
    at_front: Optional[bool] = None
    on_success: Optional[str] = None
    on_failure: Optional[str] = None
    meta: Optional[dict[str, Any]] = None


class BaseJob(Struct):
    """Base schema for RQ jobs."""

    id: str
    created_at: datetime
    func_name: str
    args: Optional[list[Any]] = None
    kwargs: Optional[dict[str, Any]] = None
    meta: Optional[JobMetaData] = None
    status: Optional[JobStatus] = None
    origin: Optional[str] = None
    enqueued_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    last_heartbeat: Optional[datetime] = None

    # RQ-specific fields
    instance: Optional[str] = None
    exc_info: Optional[str] = None
    result: Optional[Any] = None
    timeout: Optional[float] = 180
    result_ttl: Optional[int] = 500
    ttl: Optional[int] = 0
    failure_ttl: Optional[int] = 31536000  # 1 year

    # Relationships
    worker_name: Optional[str] = None
    queue: Optional[str] = "default"

    # Retry information
    retry: Optional[int] = 0
    max_retries: Optional[int] = 3

    # RQ Core fields for compatibility
    group_id: Optional[str] = None
    description: Optional[str] = None
    data: Optional[bytes] = None

    # Custom metadata
    origin_string: Optional[str] = None
    user_id: Optional[str] = None
    job_type: Optional[str] = None
    tags: Optional[list[str]] = None


class JobCreate(Struct):
    """Schema for creating new jobs."""

    func_name: str
    args: Optional[list[Any]] = None
    kwargs: Optional[dict[str, Any]] = None
    meta: Optional[JobMetaData] = None
    queue: Optional[str] = "default"
    description: Optional[str] = None
    depends_on: Optional[list[str]] = None
    at_front: Optional[bool] = False
    retry: Optional[int] = 0
    max_retries: Optional[int] = 3
    tags: Optional[list[str]] = None
    timeout: Optional[int] = 180
    result_ttl: Optional[int] = 500


class JobUpdate(Struct):
    """Schema for updating existing jobs."""

    status: Optional[JobStatus] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    meta: Optional[dict[str, Any]] = None


class JobListFilters(Struct):
    """Schema for job listing filters."""

    limit: int = 50
    offset: int = 0
    queue: Optional[str] = None
    status: Optional[JobStatus] = None
    worker: Optional[str] = None
    function: Optional[str] = None
    tags: Optional[list[str]] = None
    search: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"


class JobDetails(BaseJob):
    """Detailed job schema including full execution information."""

    traceback: Optional[str] = None
    meta_full: Optional[dict[str, Any]] = None
    dependency_ids: Optional[list[str]] = None
    dependent_ids: Optional[list[str]] = None
    approximate_start: Optional[datetime] = None
    approximate_end: Optional[datetime] = None
    duration_seconds: Optional[float] = None  # Added for performance monitoring


class JobMetrics(Struct):
    """Schema for job performance metrics."""

    job_id: str
    queue: Optional[str] = None
    status: Optional[JobStatus] = None
    duration_seconds: Optional[float] = None
    wait_time_seconds: Optional[float] = None
    memory_peak_mb: Optional[float] = None
    cpu_percent: Optional[float] = None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class JobBulkOperation(Struct):
    """Schema for bulk job operations."""

    job_ids: list[str]
    operation: str  # 'cancel', 'delete', 'retry', 'requeue', 'change_queue'
    target_queue: Optional[str] = None
    reason: Optional[str] = None
