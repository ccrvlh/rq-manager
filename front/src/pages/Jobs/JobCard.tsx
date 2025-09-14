import { MetricCardChart } from "@/components/MetricCardChart";
import { Badge, Box, Group, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconPlayerPlay,
  IconRepeat,
  IconX,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { Job, JobStatus } from "./types";
import { getStatusColor, getStatusLabel } from "./utils";

interface JobCardProps {
  job: Job;
  onClick: () => void;
  selected?: boolean;
}

const statusIcons: Record<JobStatus, React.ReactNode> = {
  [JobStatus.QUEUED]: <IconClock size={14} />,
  [JobStatus.STARTED]: <IconPlayerPlay size={14} />,
  [JobStatus.FINISHED]: <IconCheck size={14} />,
  [JobStatus.FAILED]: <IconX size={14} />,
  [JobStatus.DEFERRED]: <IconClock size={14} />,
  [JobStatus.SCHEDULED]: <IconAlertTriangle size={14} />,
  [JobStatus.STOPPED]: <IconX size={14} />,
  [JobStatus.CANCELED]: <IconX size={14} />,
};

export const JobCard: React.FC<JobCardProps> = ({ job, onClick, selected }) => {
  // Calculate progress from meta if available
  const progress = (job.meta?.meta?.progress as number) || 0;

  // Job status-based metrics
  const getJobMetricValue = () => {
    switch (job.status) {
      case JobStatus.FINISHED:
        return 100; // Complete
      case JobStatus.FAILED:
        return 0; // Failed
      case JobStatus.STARTED:
        return progress * 100; // Progress percentage
      case JobStatus.QUEUED:
      case JobStatus.SCHEDULED:
        return 0; // Waiting
      case JobStatus.DEFERRED:
        return 25; // Deferred but pending
      default:
        return 50;
    }
  };

  const jobValue = getJobMetricValue();
  const getStatusTrend = () => {
    switch (job.status) {
      case JobStatus.FINISHED:
        return "up" as const;
      case JobStatus.FAILED:
        return "down" as const;
      case JobStatus.STARTED:
        return progress > 0.5 ? ("up" as const) : ("stable" as const);
      default:
        return "stable" as const;
    }
  };

  return (
    <Box
      style={{
        padding: "16px",
        border: `1px solid ${selected ? "#228be6" : "#e9ecef"}`,
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backgroundColor: selected ? "#e3f2fd" : undefined,
      }}
      onClick={onClick}
    >
      {/* Header with function name and status */}
      <Group justify="space-between" align="flex-start" mb="md">
        <div style={{ flex: 1 }}>
          <Text fw={700} size="md" truncate>
            {job.func_name}
          </Text>
          <Text size="xs" c="dimmed">
            {job.queue || "default"} •{" "}
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </Text>
        </div>

        <Badge
          color={getStatusColor(job.status as JobStatus)}
          size="sm"
          leftSection={job.status && statusIcons[job.status]}
          style={{ flexShrink: 0 }}
        >
          {job.status && getStatusLabel(job.status)}
        </Badge>
      </Group>

      {/* Metrics Chart Section */}
      <Box mb="md">
        <MetricCardChart
          value={jobValue}
          label={job.status === JobStatus.STARTED ? "Progress" : "Status"}
          data={[]}
          color={getStatusColor(job.status as JobStatus)}
          unit="%"
          icon={job.status && statusIcons[job.status]}
          trend={getStatusTrend()}
          formatValue={() => {
            if (job.status === JobStatus.STARTED) {
              return `${Math.round(progress * 100)}%`;
            }
            if (job.status === JobStatus.FINISHED) {
              return "✓ Complete";
            }
            if (job.status === JobStatus.FAILED) {
              return "✗ Failed";
            }
            return getStatusLabel(job.status);
          }}
        />
      </Box>

      {/* Footer with job metadata */}
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed" fw={500}>
          ID: {job.id.substring(0, 8)}...
        </Text>

        <Group gap="md">
          <Group gap="xs">
            <IconRepeat size={12} />
            <Text size="xs" c="dimmed" fw={500}>
              {job.retry || 0}/{job.max_retries || 3}
            </Text>
          </Group>

          {job.ended_at && (
            <Text size="xs" c="dimmed" fw={500}>
              Duration:{" "}
              {formatDistanceToNow(new Date(job.ended_at), {
                addSuffix: false,
              })}
            </Text>
          )}
        </Group>
      </Group>
    </Box>
  );
};
