import { useSettings } from "@/contexts/SettingsContext";
import { TimePeriod } from "@/pages/Home/TimePeriodSelector";
import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export interface TimeSeriesData {
  timestamp: string;
  queue_name?: string;
  worker_name?: string;
  status?: string;
  count?: number;
  successful_jobs?: number;
  failed_jobs?: number;
  working_time?: number;
}

const buildPeriodParams = (period: TimePeriod) => {
  const params = new URLSearchParams();

  if (period.period) {
    params.set("period", period.period);
  } else if (period.startDate && period.endDate) {
    params.set("start_date", period.startDate.toISOString());
    params.set("end_date", period.endDate.toISOString());
  }

  return params.toString();
};

const fetchWorkerThroughput = async (period: TimePeriod): Promise<any[]> => {
  const periodParams = buildPeriodParams(period);
  const response = await api.get(
    `/analytics/workers/throughput?${periodParams}`
  );
  return response.data;
};

export const useWorkerThroughput = (period: TimePeriod) => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["analytics", "worker_throughput", period],
    queryFn: () => fetchWorkerThroughput(period),
    refetchInterval: settings.autoRefresh
      ? settings.analyticsRefreshInterval
      : false,
  });
};

const fetchQueuesDepth = async (period: TimePeriod): Promise<any[]> => {
  const periodParams = buildPeriodParams(period);
  const response = await api.get(`/analytics/queues/depth?${periodParams}`);
  return response.data;
};

export const useQueueDepth = (period: TimePeriod) => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: ["analytics", "queue_evolution", period],
    queryFn: () => fetchQueuesDepth(period),
    refetchInterval: settings.autoRefresh
      ? settings.analyticsRefreshInterval
      : false,
  });
};
