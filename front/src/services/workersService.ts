import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export interface Worker {
  id: string;
  name: string;
  hostname?: string;
  pid?: number;
  status: "busy" | "idle" | "started" | "suspended" | "busy_long" | "dead";
  state:
    | "starting"
    | "running"
    | "suspended"
    | "stopped"
    | "terminating"
    | "dead";
  queues?: string[];
  current_queue?: string;
  current_job_id?: string;
  current_job_func?: string;
  successful_jobs: number;
  failed_jobs: number;
  total_jobs: number;
  birth_date?: string;
  last_heartbeat?: string;
  busy_since?: string;
  worker_version?: string;
  python_version?: string;
  memory_usage?: number;
  cpu_percent?: number;
  created_at: string;
  updated_at: string;
  is_scheduler?: boolean;
}

export interface WorkerCounts {
  total: number;
  busy: number;
  idle: number;
  starting: number;
  suspended: number;
  busy_long: number;
  dead: number;
}

export interface WorkerListFilters {
  offset?: number;
  limit?: number;
  status?: string;
  queues?: string;
  hostname?: string;
  search?: string;
  healthy_only?: boolean;
  active_only?: boolean;
  include_dead?: boolean;
}

const WORKERS_QUERY_KEY = "workers";
const WORKER_COUNTS_QUERY_KEY = "worker-counts";

export const useWorkers = (params: WorkerListFilters) => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [WORKERS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await api.get("/workers", { params });
      return response.data as Worker[];
    },
    refetchInterval: settings.autoRefresh
      ? settings.workersRefreshInterval
      : false,
    staleTime: 5000,
  });
};

export const useWorker = (workerId: string) => {
  return useQuery({
    queryKey: [WORKERS_QUERY_KEY, workerId],
    queryFn: async () => {
      const response = await api.get(`/workers/${workerId}`);
      return response.data as Worker;
    },
    enabled: !!workerId,
    staleTime: 30000,
  });
};

export const useWorkerCounts = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [WORKER_COUNTS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/workers/counts");
      return response.data as WorkerCounts;
    },
    refetchInterval: settings.autoRefresh
      ? settings.workersRefreshInterval
      : false,
  });
};

export const useWorkerJobs = (workerId: string) => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["worker-jobs", workerId],
    queryFn: async () => {
      const response = await api.get(`/workers/${workerId}/jobs`);
      return response.data;
    },
    enabled: !!workerId,
    refetchInterval: settings.autoRefresh
      ? settings.workersRefreshInterval
      : false,
  });
};

// Interface for worker-specific time series data
export interface WorkerTimeSeriesData {
  timestamp: string;
  worker_name: string;
  successful_jobs: number;
  failed_jobs: number;
  total_jobs: number;
  working_time: number;
}

export { WORKERS_QUERY_KEY };
