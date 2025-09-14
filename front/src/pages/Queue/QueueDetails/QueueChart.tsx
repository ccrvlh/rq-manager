import { QueueMetrics } from "@/pages/Queue/types";
import { Card, Group, SegmentedControl, Stack, Text } from "@mantine/core";
import { useState } from "react";

interface QueueChartProps {
  metrics: QueueMetrics;
  queueName: string;
}

export function QueueChart({ metrics }: QueueChartProps) {
  const [chartType, setChartType] = useState("jobs");

  const jobData = [
    { name: "Queued", value: metrics.queued_jobs, color: "#339af0" },
    { name: "Running", value: metrics.started_jobs, color: "#fd7e14" },
    { name: "Completed", value: metrics.finished_jobs, color: "#51cf66" },
    { name: "Failed", value: metrics.failed_jobs, color: "#ff6b6b" },
    { name: "Deferred", value: metrics.deferred_jobs, color: "#ffd43b" },
    { name: "Scheduled", value: metrics.scheduled_jobs, color: "#9775fa" },
  ].filter((item) => item.value > 0);

  const total = jobData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card p="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Text size="xl" fw={700}>
            Queue Analytics
          </Text>
          <SegmentedControl
            value={chartType}
            onChange={setChartType}
            data={[
              { label: "Job Distribution", value: "jobs" },
              { label: "Performance", value: "performance" },
            ]}
          />
        </Group>

        {chartType === "jobs" && (
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Job Distribution ({total} total)
            </Text>
            <Stack gap="sm">
              {jobData.map((item) => (
                <Group key={item.name} justify="space-between">
                  <Group gap="xs">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        backgroundColor: item.color,
                      }}
                    />
                    <Text size="sm">{item.name}</Text>
                  </Group>
                  <Group gap="md">
                    <Text size="sm" c="dimmed">
                      {((item.value / Math.max(total, 1)) * 100).toFixed(1)}%
                    </Text>
                    <Text size="sm" fw={600}>
                      {item.value.toLocaleString()}
                    </Text>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Stack>
        )}

        {chartType === "performance" && (
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Performance Metrics
            </Text>
            <Group justify="space-around">
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">
                  Utilization Rate
                </Text>
                <Text size="xl" fw={700}>
                  {metrics.utilization_rate
                    ? `${(metrics.utilization_rate * 100).toFixed(1)}%`
                    : "N/A"}
                </Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">
                  Error Rate
                </Text>
                <Text
                  size="xl"
                  fw={700}
                  c={
                    metrics.error_rate && metrics.error_rate > 0.1
                      ? "red"
                      : "green"
                  }
                >
                  {metrics.error_rate
                    ? `${(metrics.error_rate * 100).toFixed(1)}%`
                    : "N/A"}
                </Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">
                  Avg Wait Time
                </Text>
                <Text size="xl" fw={700}>
                  {metrics.avg_wait_time
                    ? metrics.avg_wait_time < 1000
                      ? `${metrics.avg_wait_time}ms`
                      : `${(metrics.avg_wait_time / 1000).toFixed(1)}s`
                    : "N/A"}
                </Text>
              </Stack>
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
