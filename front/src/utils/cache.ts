import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const cacheKeys = {
  HOME: "home",
  JOBS: "jobs",
  QUEUE: "queue",
  WORKERS: "workers",
  SETTINGS: "settings",
};
