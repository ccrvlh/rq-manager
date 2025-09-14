import { useSettings } from "@/contexts/SettingsContext";
import { Job, JobStatus } from "@/pages/Jobs/types";
import { QueueDetails } from "@/pages/Queue/types";
import { Worker } from "@/services/workersService";
import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  totalJobs: number;
  failedJobs: number;
  activeWorkers: number;
  totalQueues: number;
  successRate: number;
  processingCapacity: number;
}

export interface JobCounts {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
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

const DASHBOARD_STATS_QUERY_KEY = "dashboard-stats";

export const useDashboardStats = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [DASHBOARD_STATS_QUERY_KEY],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch job counts
      const jobCountsResponse = await api.get("/jobs/counts");
      const jobCounts = jobCountsResponse.data as JobCounts;

      // Fetch worker counts
      const workerCountsResponse = await api.get("/workers/counts");
      const workerCounts = workerCountsResponse.data as WorkerCounts;

      // Fetch queues to get total count
      const queuesResponse = await api.get("/queues");
      const queues = queuesResponse.data.data || [];

      // Calculate stats
      const totalJobs = Object.values(jobCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      const failedJobs = jobCounts.failed || 0;
      const activeWorkers =
        workerCounts.busy + workerCounts.idle + workerCounts.starting;
      const totalQueues = queues.length;
      const successRate =
        totalJobs > 0 ? ((jobCounts.completed || 0) / totalJobs) * 100 : 0;
      const processingCapacity =
        workerCounts.total > 0
          ? (workerCounts.busy / workerCounts.total) * 100
          : 0;

      return {
        totalJobs,
        failedJobs,
        activeWorkers,
        totalQueues,
        successRate: Math.round(successRate * 10) / 10,
        processingCapacity: Math.round(processingCapacity * 10) / 10,
      };
    },
    refetchInterval: settings.autoRefresh
      ? settings.dashboardRefreshInterval
      : false,
    staleTime: 5000,
  });
};

export const useRecentJobs = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["recent-jobs"],
    queryFn: async (): Promise<Job[]> => {
      const response = await api.get("/jobs", {
        params: {
          limit: 10,
          offset: 0,
          sort_by: "created_at",
          sort_order: "desc",
        },
      });
      return response.data.data || [];
    },
    refetchInterval: settings.autoRefresh
      ? settings.dashboardRefreshInterval
      : false,
    staleTime: 5000,
  });
};

export const useFailedJobs = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["failed-jobs"],
    queryFn: async (): Promise<Job[]> => {
      const response = await api.get("/jobs", {
        params: {
          limit: 10,
          offset: 0,
          status: JobStatus.FAILED,
          sort_by: "created_at",
          sort_order: "desc",
        },
      });
      return response.data.data || [];
    },
    refetchInterval: settings.autoRefresh
      ? settings.dashboardRefreshInterval
      : false,
    staleTime: 5000,
  });
};

export const useDashboardWorkers = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["dashboard-workers"],
    queryFn: async (): Promise<Worker[]> => {
      const response = await api.get("/workers", {
        params: {
          limit: 10,
          offset: 0,
        },
      });
      return response.data || [];
    },
    refetchInterval: settings.autoRefresh
      ? settings.dashboardRefreshInterval
      : false,
    staleTime: 5000,
  });
};

export const useDashboardQueues = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["dashboard-queues"],
    queryFn: async (): Promise<QueueDetails[]> => {
      const response = await api.get("/queues");
      return response.data.data || [];
    },
    refetchInterval: settings.autoRefresh
      ? settings.dashboardRefreshInterval
      : false,
    staleTime: 5000,
  });
};
