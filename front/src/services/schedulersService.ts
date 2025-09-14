import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";

export interface Scheduler {
  id: string;
  name: string;
  hostname?: string;
  pid?: number;
  status: string;
  birth_date?: string;
  last_heartbeat?: string;
  scheduled_jobs_count: number;
  created_at: string;
  updated_at: string;
}

export interface SchedulerCounts {
  total: number;
  active: number;
  inactive: number;
}

const SCHEDULERS_QUERY_KEY = "schedulers";
const SCHEDULER_COUNTS_QUERY_KEY = "scheduler-counts";

export const useSchedulers = () => {
  return useQuery({
    queryKey: [SCHEDULERS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/schedulers");
      return response.data as Scheduler[];
    },
    staleTime: 5000,
  });
};

export const useSchedulerCounts = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [SCHEDULER_COUNTS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/schedulers/counts");
      return response.data as SchedulerCounts;
    },
    refetchInterval: settings.autoRefresh ? settings.workersRefreshInterval : false,
  });
};
