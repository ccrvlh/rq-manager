// Align with backend Queue schemas from api/app/schemas/queues.py

export enum QueueStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  FAILED = "failed",
  SCHEDULED = "scheduled",
}

export enum QueuePriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface Queue {
  name: string;
  created_at: string; // ISO datetime string
  status: QueueStatus;
  priority: QueuePriority;
  count: number;
  failed_job_registry_count: number;
  deferred_job_registry_count: number;
  scheduled_job_registry_count: number;

  // Job counts by status (from QueueDetails)
  queued_jobs: number;
  started_jobs: number;
  finished_jobs: number;
  failed_jobs: number;
  deferred_jobs: number;
  scheduled_jobs: number;
}

export interface QueueDetails extends Queue {
  // Job counts by status
  queued_jobs: number;
  started_jobs: number;
  finished_jobs: number;
  failed_jobs: number;
  deferred_jobs: number;
  scheduled_jobs: number;

  // Registry counts
  failed_registry_count: number;
  deferred_registry_count: number;
  started_registry_count: number;
  finished_registry_count: number;

  last_activity?: string | null; // ISO datetime string
  worker_count: number;

  // Settings
  default_job_timeout: number;
  default_result_ttl: number;
  default_failure_ttl: number;

  // Custom metadata
  description?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface QueueCreate {
  name: string;
  priority?: QueuePriority;
  description?: string | null;
  default_job_timeout?: number;
  default_result_ttl?: number;
  default_failure_ttl?: number;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface QueueUpdate {
  priority?: QueuePriority | null;
  status?: QueueStatus | null;
  description?: string | null;
  default_job_timeout?: number | null;
  default_result_ttl?: number | null;
  default_failure_ttl?: number | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface QueueListFilters {
  status?: QueueStatus | null;
  priority?: QueuePriority | null;
  search?: string | null;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface QueueMetrics {
  timestamp: string; // ISO datetime string
  queue_name: string;
  total_jobs: number;
  queued_jobs: number;
  started_jobs: number;
  finished_jobs: number;
  failed_jobs: number;
  deferred_jobs: number;
  scheduled_jobs: number;
  avg_wait_time?: number | null;
  avg_run_time?: number | null;
  utilization_rate?: number | null;
  error_rate?: number | null;
}

export interface QueueHealth {
  queue_name: string;
  status: QueueStatus;
  is_healthy: boolean;
  worker_count: number;
  queued_job_count: number;
  redis_connection: boolean;
  last_activity?: string | null; // ISO datetime string
  response_time_ms?: number | null;
  error_message?: string | null;
}

export interface QueuesResponse {
  data: Queue[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
