import { useSettings } from "@/contexts/SettingsContext";
import {
  Queue,
  QueueCreate,
  QueueDetails,
  QueueHealth,
  QueueListFilters,
  QueueMetrics,
  QueueUpdate,
} from "@/pages/Queue/types";
import { api } from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUEUES_QUERY_KEY = "queues";
const QUEUE_METRICS_QUERY_KEY = "queue-metrics";
const QUEUE_HEALTH_QUERY_KEY = "queue-health";

const transformQueryParams = (params: QueueListFilters) => {
  return {
    limit: params.limit,
    offset: params.offset,
    status: params.status || undefined,
    priority: params.priority || undefined,
    search: params.search || undefined,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
  };
};

export const useQueues = (params: QueueListFilters) => {
  return useQuery({
    queryKey: [QUEUES_QUERY_KEY, params],
    queryFn: async () => {
      const apiParams = transformQueryParams(params);
      const response = await api.get("/queues", {
        params: apiParams,
      });

      // Backend returns { data: QueueDetails[] }
      const queues = response.data.data || [];

      return {
        data: queues,
        total: queues.length,
        offset: params.offset || 0,
        limit: params.limit || 50,
        has_more: false,
      };
    },
    staleTime: 5000,
  });
};

export const useQueue = (queueName: string) => {
  return useQuery({
    queryKey: [QUEUES_QUERY_KEY, queueName],
    queryFn: async () => {
      const response = await api.get(`/queues/${queueName}`);
      return response.data.data as QueueDetails;
    },
    enabled: !!queueName,
    staleTime: 30000,
  });
};

export const useQueueMetrics = (queueName: string) => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [QUEUE_METRICS_QUERY_KEY, queueName],
    queryFn: async () => {
      const response = await api.get(`/queues/${queueName}/metrics`);
      return response.data.data as QueueMetrics;
    },
    enabled: !!queueName,
    refetchInterval: settings.autoRefresh
      ? settings.queuesRefreshInterval
      : false,
  });
};

export const useQueueHealth = (queueName: string) => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [QUEUE_HEALTH_QUERY_KEY, queueName],
    queryFn: async () => {
      const response = await api.get(`/queues/${queueName}/health`);
      return response.data.data as QueueHealth;
    },
    enabled: !!queueName,
    refetchInterval: settings.autoRefresh
      ? settings.queuesRefreshInterval
      : false,
  });
};

export const useCreateQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueData: QueueCreate) => {
      const response = await api.post("/queues", queueData);
      return response.data.data as Queue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUES_QUERY_KEY] });
    },
  });
};

export const useUpdateQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      queueName,
      data,
    }: {
      queueName: string;
      data: QueueUpdate;
    }) => {
      const response = await api.put(`/queues/${queueName}`, data);
      return response.data.data as Queue;
    },
    onSuccess: (_, { queueName }) => {
      queryClient.invalidateQueries({ queryKey: [QUEUES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [QUEUES_QUERY_KEY, queueName],
      });
    },
  });
};

export const useDeleteQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueName: string) => {
      await api.delete(`/queues/${queueName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUES_QUERY_KEY] });
    },
  });
};

export const useEmptyQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueName: string) => {
      const response = await api.post(`/queues/${queueName}/empty`);
      return response.data;
    },
    onSuccess: (_, queueName) => {
      queryClient.invalidateQueries({ queryKey: [QUEUES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [QUEUES_QUERY_KEY, queueName],
      });
      queryClient.invalidateQueries({
        queryKey: [QUEUE_METRICS_QUERY_KEY, queueName],
      });
      queryClient.invalidateQueries({
        queryKey: [QUEUE_HEALTH_QUERY_KEY, queueName],
      });
    },
  });
};

export const useBulkQueueOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      operation: string;
      queueNames: string[];
      reason?: string;
    }) => {
      const response = await api.post("/queues/bulk", {
        operation: data.operation,
        queue_names: data.queueNames,
        reason: data.reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUEUES_QUERY_KEY] });
    },
  });
};

export interface QueueTimeSeriesData {
  timestamp: string;
  queue_name: string;
  queued_jobs: number;
  started_jobs: number;
  finished_jobs: number;
  failed_jobs: number;
  total_jobs: number;
}

export { QUEUES_QUERY_KEY };
