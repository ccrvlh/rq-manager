import { api } from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";

const SCHEDULED_JOBS_QUERY_KEY = "scheduled-jobs";
const SCHEDULED_JOB_COUNTS_QUERY_KEY = "scheduled-job-counts";

export interface ScheduledJob {
  id: string;
  func_name: string;
  args?: any[];
  kwargs?: Record<string, any>;
  queue: string;
  scheduled_for?: string;
  created_at?: string;
  timeout?: number;
  description?: string;
  meta?: Record<string, any>;
  cron?: string;
  repeat?: number;
  interval?: number;
}

export interface ScheduledJobsQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  queue?: string;
}

export const useScheduledJobs = (params?: ScheduledJobsQueryParams) => {
  return useQuery({
    queryKey: [SCHEDULED_JOBS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await api.get("/scheduled", { params });
      return response.data as {
        data: ScheduledJob[];
        total: number;
        offset: number;
        limit: number;
        has_more: boolean;
      };
    },
    staleTime: 5000,
  });
};

export const useScheduledJobCounts = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [SCHEDULED_JOB_COUNTS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/scheduled/counts");
      return response.data as {
        total: number;
        pending: number;
        overdue: number;
      };
    },
    refetchInterval: settings.autoRefresh ? settings.jobsRefreshInterval : false,
  });
};

export const useDeleteScheduledJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/scheduled/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCHEDULED_JOBS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [SCHEDULED_JOB_COUNTS_QUERY_KEY],
      });
    },
  });
};
