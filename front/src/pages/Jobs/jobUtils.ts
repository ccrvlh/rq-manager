import { Job } from "./types";

/**
 * Create unique key for job runs to handle same job ID with different runs.
 * This combines the job ID with the creation timestamp to ensure uniqueness
 * across different runs of the same job.
 */
export const getJobKey = (job: Job): string => {
  return `${job.id}-${job.created_at}`;
};

/**
 * Extract the original job ID from a job key.
 * This is used when making API calls that expect the actual job ID.
 */
export const getJobIdFromKey = (jobKey: string): string => {
  return jobKey.split('-')[0];
};

/**
 * Convert an array of job keys to job IDs for bulk operations.
 */
export const getJobIdsFromKeys = (jobKeys: string[]): string[] => {
  return jobKeys.map(getJobIdFromKey);
};