import { JobStatus } from "./types";

export const getStatusColor = (
  status: JobStatus | null | undefined
): string => {
  const colors = {
    [JobStatus.QUEUED]: "blue",
    [JobStatus.STARTED]: "green",
    [JobStatus.FINISHED]: "teal",
    [JobStatus.FAILED]: "red",
    [JobStatus.DEFERRED]: "yellow",
    [JobStatus.SCHEDULED]: "purple",
    [JobStatus.STOPPED]: "orange",
    [JobStatus.CANCELED]: "gray",
  };
  return colors[status as JobStatus] || "gray";
};

export const getStatusLabel = (
  status: JobStatus | null | undefined
): string => {
  const labels = {
    [JobStatus.QUEUED]: "Queued",
    [JobStatus.STARTED]: "Active",
    [JobStatus.FINISHED]: "Completed",
    [JobStatus.FAILED]: "Failed",
    [JobStatus.DEFERRED]: "Deferred",
    [JobStatus.SCHEDULED]: "Scheduled",
    [JobStatus.STOPPED]: "Stopped",
    [JobStatus.CANCELED]: "Canceled",
  };
  return labels[status as JobStatus] || "Unknown";
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};
