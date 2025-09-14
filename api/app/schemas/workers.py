"""RQ Worker Schemas - Represents workers in the queueing system."""

from enum import Enum
from typing import Any
from typing import Optional
from datetime import datetime

from msgspec import Struct


class WorkerStatus(str, Enum):
    """Worker status enumeration matching RQ worker states."""

    BUSY = "busy"  # Currently processing a job
    IDLE = "idle"  # Waiting for work
    STARTED = "started"  # Worker process started but not ready
    SUSPENDED = "suspended"  # Worker manually suspended
    BUSY_LONG = "busy_long"  # Worker has been busy for extended time
    DEAD = "dead"  # Worker process is dead/unresponsive


class WorkerState(str, Enum):
    """Worker operational states."""

    STARTING = "starting"
    RUNNING = "running"
    SUSPENDED = "suspended"
    STOPPED = "stopped"
    TERMINATING = "terminating"
    DEAD = "dead"


class WorkerKind(str, Enum):
    """Type of worker."""

    SIMPLE = "simple"
    POOL = "pool"
    GEVENT = "gevent"
    FIBER = "fiber"


class WorkerMetaData(Struct):
    """Schema for worker metadata including configuration."""

    # Worker configuration
    name: Optional[str] = None
    queues: Optional[list[str]] = None
    burst_mode: Optional[bool] = None

    # Processing settings
    job_monitoring_interval: Optional[int] = None
    max_idle_time: Optional[int] = None
    timeout: Optional[int] = None

    # Resource limits
    max_jobs_per_worker: Optional[int] = None
    max_memory: Optional[int] = None  # MB
    max_peak_memory: Optional[int] = None  # MB

    # Custom metadata
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class ProcessInfo(Struct):
    """Schema for worker process information."""

    pid: Optional[int] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    user: Optional[str] = None
    cwd: Optional[str] = None
    python_version: Optional[str] = None
    redis_version: Optional[str] = None


class BaseWorker(Struct):
    """Base schema for RQ workers."""

    id: str
    name: str
    created_at: datetime
    updated_at: datetime

    # Worker identification
    hostname: Optional[str] = None
    pid: Optional[int] = None
    worker_kind: WorkerKind = WorkerKind.SIMPLE

    # Current state
    status: WorkerStatus = WorkerStatus.IDLE
    state: WorkerState = WorkerState.RUNNING

    # Connection info
    remote_ip: Optional[str] = None
    remote_port: Optional[int] = None

    # Queue assignments
    queues: Optional[list[str]] = None
    current_queue: Optional[str] = None

    # Job information
    current_job_id: Optional[str] = None
    current_job_func: Optional[str] = None
    successful_jobs: int = 0
    failed_jobs: int = 0
    total_jobs: int = 0

    # Performance metrics
    worker_version: Optional[str] = None
    python_version: Optional[str] = None

    # Timing
    birth_date: Optional[datetime] = None
    last_heartbeat: Optional[datetime] = None
    busy_since: Optional[datetime] = None

    # Resources
    memory_usage: Optional[int] = None  # MB
    cpu_percent: Optional[float] = None
    total_memory: Optional[int] = None  # MB

    # Configuration
    max_job_runtime: Optional[int] = None  # seconds
    max_idle_time: Optional[int] = None  # seconds

    # Health checks
    health_check_enabled: bool = True
    last_health_check: Optional[datetime] = None

    # Custom metadata
    meta: Optional[WorkerMetaData] = None
    tags: Optional[list[str]] = None


class WorkerDetails(BaseWorker):
    """Detailed worker schema with extended information."""

    # Extended process information
    process_info: Optional[ProcessInfo] = None

    # Job execution details
    last_job_started: Optional[datetime] = None
    last_job_ended: Optional[datetime] = None
    total_processing_time: Optional[float] = None  # seconds

    # Queue statistics
    queues_details: Optional[dict[str, Any]] = None

    # Configuration details
    config: Optional[dict[str, Any]] = None

    # Health status
    is_healthy: bool = True
    last_error: Optional[str] = None
    is_scheduler: bool = False

    # System resources
    system_uptime: Optional[float] = None
    load_average_1m: Optional[float] = None
    load_average_5m: Optional[float] = None
    load_average_15m: Optional[float] = None
    disk_usage_percent: Optional[float] = None


class WorkerCreate(Struct):
    """Schema for creating new workers."""

    name: str
    queues: Optional[list[str]] = None
    worker_kind: WorkerKind = WorkerKind.SIMPLE
    burst_mode: bool = False

    # Configuration overrides
    max_job_runtime: Optional[int] = None
    max_idle_time: Optional[int] = None
    max_jobs_per_worker: Optional[int] = None

    # Custom settings
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    config: Optional[dict[str, Any]] = None


class WorkerUpdate(Struct):
    """Schema for updating existing workers."""

    name: Optional[str] = None
    queues: Optional[list[str]] = None
    status: Optional[WorkerStatus] = None
    max_job_runtime: Optional[int] = None
    max_idle_time: Optional[int] = None

    # Custom metadata
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    config: Optional[dict[str, Any]] = None


class WorkerListFilters(Struct):
    """Schema for worker listing filters."""

    status: Optional[WorkerStatus] = None
    queues: Optional[list[str]] = None
    hostname: Optional[str] = None
    worker_kind: Optional[WorkerKind] = None
    search: Optional[str] = None

    # Pagination
    limit: Optional[int] = 50
    offset: Optional[int] = 0

    # Sorting
    sort_by: Optional[str] = "name"
    sort_order: Optional[str] = "asc"

    # Filters by state
    healthy_only: Optional[bool] = None
    active_only: Optional[bool] = None


class WorkerMetrics(Struct):
    """Schema for worker performance metrics."""

    worker_id: str
    worker_name: str
    timestamp: datetime

    # Job processing metrics
    jobs_processed: int = 0
    jobs_failed: int = 0
    jobs_retried: int = 0
    total_processing_time: float = 0.0
    avg_job_duration: Optional[float] = None

    # Queue metrics
    queues_handled: Optional[list[str]] = None
    total_jobs_per_queue: Optional[dict[str, int]] = None

    # System metrics
    memory_usage: Optional[int] = None  # MB
    memory_utilization: Optional[float] = None  # 0-100
    cpu_utilization: Optional[float] = None  # 0-100

    # Performance ratios
    success_rate: Optional[float] = None  # 0-100
    error_rate: Optional[float] = None  # 0-100

    # Timing
    uptime_seconds: Optional[float] = None
    idle_time: Optional[float] = None
    busy_time: Optional[float] = None


class WorkerHealth(Struct):
    """Schema for worker health check results."""

    worker_id: str
    worker_name: str
    status: WorkerState

    # Health indicators
    is_healthy: bool
    is_responsive: bool
    redis_connection: bool
    last_health_check: datetime
    next_health_check: datetime
    last_heartbeat_delta: Optional[float] = None  # seconds

    # Resource health
    memory_usage: Optional[int] = None  # MB
    memory_usage_percent: Optional[float] = None  # 0-100
    cpu_percent: Optional[float] = None

    # Connection health
    redis_response_time_ms: Optional[float] = None

    # Error information
    last_error: Optional[str] = None
    error_count: int = 0

    # Timing


class WorkerBulkOperation(Struct):
    """Schema for bulk worker operations."""

    worker_ids: list[str]
    operation: str  # 'pause', 'resume', 'stop', 'kill', 'restart'

    # Operation metadata
    queue_name: Optional[str] = None
    reason: Optional[str] = None
    force: bool = False

    # Batch settings
    max_concurrent: Optional[int] = None
    delay_between: Optional[int] = None  # seconds


class WorkerConfig(Struct):
    """Schema for worker configuration options."""

    worker_name: str

    # Queue settings
    queues: Optional[list[str]] = None
    default_queue: Optional[str] = "default"

    # Resource limits
    max_memory: Optional[int] = None  # MB
    max_idle_time: Optional[int] = None  # seconds

    # Processing settings
    max_job_runtime: Optional[int] = None  # seconds
    job_monitoring_interval: Optional[int] = None

    # Retry settings
    exponential_backoff_factor: Optional[float] = None
    max_exponential_backoff: Optional[int] = None

    # Connection settings
    redis_url: Optional[str] = None
    redis_db: Optional[int] = None

    # Logging
    log_level: Optional[str] = "INFO"
    log_format: Optional[str] = None

    # Custom settings
    config: Optional[dict[str, Any]] = None


class WorkerPoolInfo(Struct):
    """Schema for worker pool information (when workers are part of pools)."""

    pool_id: str
    pool_name: str

    # Worker counts
    total_workers: int
    active_workers: int
    idle_workers: int
    failed_workers: int
    pool_kind: WorkerKind

    # Pool metrics
    total_jobs_processed: int = 0
    total_jobs_failed: int = 0

    # Configuration
    max_workers: Optional[int] = None

    # Settings
    queues: Optional[list[str]] = None
    description: Optional[str] = None

    # Health
    is_healthy: bool = True
    health_check_interval: Optional[int] = None
    last_health_check: Optional[datetime] = None


class WorkerCounts(Struct):
    """Schema for worker counts by status."""

    total: int
    busy: int
    idle: int
    starting: int
    suspended: int
    busy_long: int
    dead: int
