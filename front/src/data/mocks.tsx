// Mock data for RQ Manager
export interface Queue {
  id: number;
  name: string;
  total: number;
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

export interface Worker {
  id: number;
  name: string;
  status: "active" | "idle" | "stopped";
  queues: string[];
  currentJob: string | null;
  startedAt: Date;
}

export interface Job {
  id: string;
  function: string;
  args: any;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  enqueuedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export interface FailedJob {
  id: string;
  function: string;
  args: any;
  error: string;
  failedAt: Date;
}

export const mockQueues: Queue[] = [
  {
    id: 1,
    name: "default",
    total: 245,
    pending: 45,
    processing: 12,
    failed: 8,
    completed: 180,
  },
  {
    id: 2,
    name: "high",
    total: 89,
    pending: 12,
    processing: 3,
    failed: 2,
    completed: 72,
  },
  {
    id: 3,
    name: "low",
    total: 567,
    pending: 134,
    processing: 28,
    failed: 45,
    completed: 360,
  },
  {
    id: 4,
    name: "urgent",
    total: 23,
    pending: 3,
    processing: 1,
    failed: 0,
    completed: 19,
  },
];

export const mockWorkers: Worker[] = [
  {
    id: 1,
    name: "worker-1",
    status: "active",
    queues: ["default", "high"],
    currentJob: "process_upload",
    startedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 2,
    name: "worker-2",
    status: "active",
    queues: ["low"],
    currentJob: null,
    startedAt: new Date(Date.now() - 7200000),
  },
  {
    id: 3,
    name: "worker-3",
    status: "idle",
    queues: ["urgent", "high"],
    currentJob: null,
    startedAt: new Date(Date.now() - 1800000),
  },
];

export const mockRecentJobs: Job[] = [
  {
    id: "job-1",
    function: "send_email",
    args: { to: "user@example.com", subject: "Welcome" },
    status: "completed",
    enqueuedAt: new Date(Date.now() - 600000),
    startedAt: new Date(Date.now() - 500000),
    finishedAt: new Date(Date.now() - 300000),
  },
  {
    id: "job-2",
    function: "process_image",
    args: { image_id: "img-123" },
    status: "processing",
    enqueuedAt: new Date(Date.now() - 120000),
  },
  {
    id: "job-3",
    function: "cleanup_database",
    args: {},
    status: "failed",
    enqueuedAt: new Date(Date.now() - 900000),
    failedAt: new Date(Date.now() - 800000),
    error: "Connection timeout",
  },
];

export const mockFailedJobs: FailedJob[] = [
  {
    id: "fail-1",
    function: "generate_report",
    args: { report_id: "rpt-456" },
    error: "Memory limit exceeded",
    failedAt: new Date(Date.now() - 3600000),
  },
  {
    id: "fail-2",
    function: "sync_external_api",
    args: { endpoint: "/products" },
    error: "API rate limit exceeded",
    failedAt: new Date(Date.now() - 1800000),
  },
];
