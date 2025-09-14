import { QueueMetrics } from "@/pages/Queue/types";
import { Card, Grid, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  IconActivity,
  IconAlertTriangle,
  IconClock,
  IconListCheck,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";

interface QueueMetricsGridProps {
  metrics: QueueMetrics;
}

export function QueueMetricsGrid({ metrics }: QueueMetricsGridProps) {
  const formatTime = (ms: number | null | undefined) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined) return "N/A";
    return `${(rate * 100).toFixed(1)}%`;
  };

  const metricCards = [
    {
      title: "Total Jobs",
      value: metrics.total_jobs.toLocaleString(),
      icon: IconListCheck,
      color: "blue",
    },
    {
      title: "Queued Jobs",
      value: metrics.queued_jobs.toLocaleString(),
      icon: IconUsers,
      color: "cyan",
    },
    {
      title: "Running Jobs",
      value: metrics.started_jobs.toLocaleString(),
      icon: IconActivity,
      color: "orange",
    },
    {
      title: "Completed Jobs",
      value: metrics.finished_jobs.toLocaleString(),
      icon: IconTrendingUp,
      color: "green",
    },
    {
      title: "Failed Jobs",
      value: metrics.failed_jobs.toLocaleString(),
      icon: IconAlertTriangle,
      color: "red",
    },
    {
      title: "Avg Wait Time",
      value: formatTime(metrics.avg_wait_time),
      icon: IconClock,
      color: "yellow",
    },
    {
      title: "Avg Run Time",
      value: formatTime(metrics.avg_run_time),
      icon: IconClock,
      color: "purple",
    },
    {
      title: "Error Rate",
      value: formatPercentage(metrics.error_rate),
      icon: IconAlertTriangle,
      color: metrics.error_rate && metrics.error_rate > 0.1 ? "red" : "green",
    },
  ];

  return (
    <Card p="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Text size="xl" fw={700}>
          Queue Metrics
        </Text>

        <Grid>
          {metricCards.map((metric) => (
            <Grid.Col key={metric.title} span={3}>
              <Card p="md" radius="sm" withBorder>
                <Stack gap="xs">
                  <Group gap="xs">
                    <ThemeIcon color={metric.color} variant="light" size="sm">
                      <metric.icon size={16} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">
                      {metric.title}
                    </Text>
                  </Group>
                  <Text size="xl" fw={700}>
                    {metric.value}
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <Text size="xs" c="dimmed">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </Text>
      </Stack>
    </Card>
  );
}
