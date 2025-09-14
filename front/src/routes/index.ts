export const routes = {
  home: "/",
  jobs: "/jobs",
  scheduled: "/scheduled",
  queue: "/queues",
  queueDetails: "/queues/:queueName",
  settings: "/settings",
  workers: "/workers",
  workerDetails: "/workers/:workerId",
  error: "/500",
  notFound: "/404",
};

export const getQueueDetailsRoute = (queueName: string) =>
  `/queues/${encodeURIComponent(queueName)}`;
export const getWorkerDetailsRoute = (workerId: string) =>
  `/workers/${encodeURIComponent(workerId)}`;
