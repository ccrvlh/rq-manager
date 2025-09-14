import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export interface RedisHealth {
  status: "healthy" | "unhealthy";
  ping: boolean;
  memory?: {
    used_bytes: number;
    used_human: string;
    max_bytes: number;
    usage_percent: number;
  };
  connections?: {
    connected_clients: number;
  };
  database?: {
    size: number;
  };
  version?: string;
  uptime_seconds?: number;
  error?: string;
}

export interface SystemHealth {
  status: "healthy" | "unhealthy";
  services: {
    redis: RedisHealth;
  };
}

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ["system-health"],
    queryFn: async (): Promise<SystemHealth> => {
      const response = await api.get("/health");
      return response.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });
};

export const useRedisHealth = () => {
  return useQuery({
    queryKey: ["redis-health"],
    queryFn: async (): Promise<RedisHealth> => {
      const response = await api.get("/health/redis");
      return response.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};