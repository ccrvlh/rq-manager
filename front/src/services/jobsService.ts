import { Job, JobsQueryParams, JobStatus } from "@/pages/Jobs/types";
import { api } from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";

const JOBS_QUERY_KEY = "jobs";
const JOB_FUNCTIONS_QUERY_KEY = "job-functions";
const JOB_COUNTS_QUERY_KEY = "job-counts";

// Transform frontend params to API params
const transformQueryParams = (params: JobsQueryParams, queue?: string) => {
  const apiParams: any = {
    limit: params.limit,
    offset: params.offset,
    status: params.status || undefined,
    worker: params.worker || undefined,
    function: params.function || undefined,
    search: params.search || undefined,
  };
  
  // Only include queue if it's defined
  if (queue) {
    apiParams.queue = queue;
  }
  
  if (params.created_after || params.created_before) {
    apiParams.created_after = params.created_after;
    apiParams.created_before = params.created_before;
  }
  
  if (params.sort_by || params.sort_order) {
    apiParams.sort_by = params.sort_by;
    apiParams.sort_order = params.sort_order;
  }
  
  return apiParams;
};

export const useJobs = (params: JobsQueryParams) => {
  return useQuery({
    queryKey: [JOBS_QUERY_KEY, params],
    queryFn: async () => {
      const queues = Array.isArray(params.queue) ? params.queue.filter(Boolean) : params.queue ? [params.queue] : [];
      
      if (queues.length === 0) {
        // No queue filter - get all jobs
        const apiParams = transformQueryParams(params, undefined);
        const response = await api.get("/jobs", {
          params: apiParams,
        });
        const data = response.data;
        return {
          data: data.data as Job[],
          total: data.total,
          offset: data.offset,
          limit: data.limit,
          has_more: data.has_more,
        };
      } else if (queues.length === 1) {
        // Single queue filter
        const apiParams = transformQueryParams(params, queues[0]);
        const response = await api.get("/jobs", {
          params: apiParams,
        });
        const data = response.data;
        return {
          data: data.data as Job[],
          total: data.total,
          offset: data.offset,
          limit: data.limit,
          has_more: data.has_more,
        };
      } else {
        // Multiple queues - fetch from each and combine
        const responses = await Promise.all(
          queues.map(queue => 
            api.get("/jobs", {
              params: transformQueryParams({ ...params, limit: Math.ceil(params.limit / queues.length) }, queue)
            })
          )
        );
        
        const allJobs = responses.flatMap(response => response.data.data as Job[]);
        const totalJobs = responses.reduce((sum, response) => sum + response.data.total, 0);
        
        // Sort and paginate combined results
        const sortedJobs = allJobs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const startIndex = params.offset;
        const endIndex = startIndex + params.limit;
        const paginatedJobs = sortedJobs.slice(startIndex, endIndex);
        
        return {
          data: paginatedJobs,
          total: totalJobs,
          offset: params.offset,
          limit: params.limit,
          has_more: endIndex < sortedJobs.length,
        };
      }
    },
    staleTime: 5000,
  });
};

export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: [JOBS_QUERY_KEY, jobId],
    queryFn: async () => {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data as Job;
    },
    enabled: !!jobId,
    staleTime: 30000,
  });
};

export const useJobFunctions = () => {
  return useQuery({
    queryKey: [JOB_FUNCTIONS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/jobs/functions");
      return response.data as string[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useJobCounts = () => {
  const { settings } = useSettings();
  return useQuery({
    queryKey: [JOB_COUNTS_QUERY_KEY],
    queryFn: async () => {
      const response = await api.get("/jobs/counts");
      return response.data as Record<JobStatus, number>;
    },
    refetchInterval: settings.autoRefresh ? settings.jobsRefreshInterval : false,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: {
      func_name: string;
      args?: unknown[];
      kwargs?: Record<string, unknown>;
      queue?: string;
      description?: string;
      timeout?: number;
      tags?: string[];
    }) => {
      const response = await api.post("/jobs", jobData);
      return response.data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [JOB_COUNTS_QUERY_KEY] });
    },
  });
};

export const useRetryJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.post(`/jobs/${jobId}/retry`);
      return response.data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY, jobId] });
      queryClient.invalidateQueries({ queryKey: [JOB_COUNTS_QUERY_KEY] });
    },
  });
};

export const useCancelJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.post(`/jobs/${jobId}/cancel`);
      return response.data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY, jobId] });
      queryClient.invalidateQueries({ queryKey: [JOB_COUNTS_QUERY_KEY] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/jobs/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [JOB_COUNTS_QUERY_KEY] });
    },
  });
};

export { JOBS_QUERY_KEY };
