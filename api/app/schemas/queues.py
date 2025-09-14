"""RQ Queue Schemas - Represents queues in the queueing system."""

from enum import Enum
from typing import Any
from typing import Optional
from datetime import datetime

from msgspec import Struct


class QueueStatus(str, Enum):
    """Queue status enumeration."""

    ACTIVE = "active"
    PAUSED = "paused"
    FAILED = "failed"  # Queue connection issues
    SCHEDULED = "scheduled"


class QueuePriority(str, Enum):
    """Queue priority levels."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class BaseQueue(Struct):
    """Base schema for RQ queues."""

    name: str
    created_at: datetime
    status: QueueStatus = QueueStatus.ACTIVE
    priority: QueuePriority = QueuePriority.NORMAL

    # RQ-specific fields
    count: int = 0  # Total jobs in queue
    failed_job_registry_count: int = 0
    deferred_job_registry_count: int = 0
    scheduled_job_registry_count: int = 0


class QueueDetails(BaseQueue):
    """Detailed queue schema with registry breakdowns."""

    # Job counts by status
    queued_jobs: int = 0
    started_jobs: int = 0
    failed_jobs: int = 0
    finished_jobs: int = 0
    deferred_jobs: int = 0
    scheduled_jobs: int = 0

    # Registry counts
    failed_registry_count: int = 0
    deferred_registry_count: int = 0
    started_registry_count: int = 0
    finished_registry_count: int = 0

    last_activity: Optional[datetime] = None
    worker_count: int = 0

    # Settings
    default_job_timeout: int = 180
    default_result_ttl: int = 500
    default_failure_ttl: int = 31536000

    # Custom metadata
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class QueueCreate(Struct):
    """Schema for creating new queues."""

    name: str
    priority: QueuePriority = QueuePriority.NORMAL
    description: Optional[str] = None
    default_job_timeout: int = 180
    default_result_ttl: int = 500
    default_failure_ttl: int = 31536000
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class QueueUpdate(Struct):
    """Schema for updating queue settings."""

    priority: Optional[QueuePriority] = None
    status: Optional[QueueStatus] = None
    description: Optional[str] = None
    default_job_timeout: Optional[int] = None
    default_result_ttl: Optional[int] = None
    default_failure_ttl: Optional[int] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class QueueListFilters(Struct):
    """Schema for queue listing filters."""

    status: Optional[QueueStatus] = None
    priority: Optional[QueuePriority] = None
    search: Optional[str] = None
    limit: Optional[int] = 50
    offset: Optional[int] = 0
    sort_by: Optional[str] = "name"
    sort_order: Optional[str] = "asc"


class QueueMetrics(Struct):
    """Schema for queue performance metrics."""

    timestamp: datetime
    queue_name: str
    total_jobs: int
    queued_jobs: int
    started_jobs: int
    finished_jobs: int
    failed_jobs: int
    deferred_jobs: int
    scheduled_jobs: int

    avg_wait_time: Optional[float] = None
    avg_run_time: Optional[float] = None

    # Queue health metrics
    utilization_rate: Optional[float] = None  # 0-100
    error_rate: Optional[float] = None  # 0-100


class QueueBulkOperation(Struct):
    """Schema for bulk queue operations."""

    queue_names: list[str]
    operation: str  # 'pause', 'resume', 'delete', 'archive'
    reason: Optional[str] = None


class QueueHealth(Struct):
    """Schema for queue health check results."""

    queue_name: str
    status: QueueStatus
    is_healthy: bool
    worker_count: int
    queued_job_count: int
    redis_connection: bool
    last_activity: Optional[datetime] = None
    response_time_ms: Optional[float] = None
    error_message: Optional[str] = None


class DefaultQueue(Struct):
    """Schema for default queue configuration."""

    name: str = "default"
    priority: QueuePriority = QueuePriority.NORMAL
    description: str = "Default queue for general jobs"
    default_job_timeout: int = 180
    default_result_ttl: int = 500
    default_failure_ttl: int = 31536000


class QueueConfig(Struct):
    """Schema for queue configuration options."""

    queue_name: str
    timeout: Optional[int] = None
    ttl: Optional[int] = None
    result_ttl: Optional[int] = None
    failure_ttl: Optional[int] = None
    max_retries: Optional[int] = None
    retry_interval: Optional[int] = None
    backoff_factor: Optional[float] = None
    at_front: Optional[bool] = None
    depends_on: Optional[list[str]] = None
