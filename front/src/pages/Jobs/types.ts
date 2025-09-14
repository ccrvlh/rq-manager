export enum JobStatus {
  CREATED = "created",
  QUEUED = "queued",
  STARTED = "started",
  FINISHED = "finished",
  FAILED = "failed",
  DEFERRED = "deferred",
  SCHEDULED = "scheduled",
  STOPPED = "stopped",
  CANCELED = "canceled",
}

export interface Job {
  id: string;
  created_at: string; // ISO datetime string
  func_name: string;
  args?: unknown[] | null;
  kwargs?: Record<string, unknown> | null;
  status?: JobStatus | null;
  origin?: string | null;
  enqueued_at?: string | null; // ISO datetime string
  started_at?: string | null; // ISO datetime string
  ended_at?: string | null; // ISO datetime string
  last_heartbeat?: string | null; // ISO datetime string
  instance?: string | null;
  exc_info?: string | null;
  result?: unknown | null;
  timeout?: number | null;
  result_ttl?: number | null;
  ttl?: number | null;
  failure_ttl?: number | null;
  retry?: number | null;
  max_retries?: number | null;
  group_id?: string | null;
  description?: string | null;
  worker_name?: string | null;
  queue?: string | null;
  meta?: JobMeta | null;
  tags?: string[] | null;
  traceback?: string | null;
  dependency_ids?: string[] | null;
  dependent_ids?: string[] | null;
  duration_seconds?: number | null;
}

export interface JobMeta {
  timeout?: number | null;
  result_ttl?: number | null;
  ttl?: number | null;
  failure_ttl?: number | null;
  max_retries?: number | null;
  retry_interval?: number | null;
  retry_backoff?: number | null;
  retry_backoff_max?: number | null;
  description?: string | null;
  depends_on?: string[] | null;
  queue_name?: string | null;
  at_front?: boolean | null;
  on_success?: string | null;
  on_failure?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface JobsQueryParams {
  limit: number;
  offset: number;
  queue?: string | string[] | null;
  status?: JobStatus | null;
  worker?: string | null;
  function?: string | null;
  search?: string | null;
  created_after?: string | null; // ISO datetime string
  created_before?: string | null; // ISO datetime string
  sort_by?: string | null;
  sort_order?: "desc" | "asc";
}

export interface JobsResponse {
  data: Job[];
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
