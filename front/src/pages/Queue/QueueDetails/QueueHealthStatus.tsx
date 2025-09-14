import { QueueHealth } from "@/pages/Queue/types";
import {
  Badge,
  Card,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck, IconClock, IconDatabase, IconX } from "@tabler/icons-react";

interface QueueHealthStatusProps {
  health: QueueHealth;
}

export function QueueHealthStatus({ health }: QueueHealthStatusProps) {
  const getHealthBadge = (isHealthy: boolean) => (
    <Badge color={isHealthy ? "green" : "red"} size="lg">
      {isHealthy ? "Healthy" : "Unhealthy"}
    </Badge>
  );

  const getHealthIcon = (isHealthy: boolean) => (
    <ThemeIcon color={isHealthy ? "green" : "red"} variant="light" size="lg">
      {isHealthy ? <IconCheck size={20} /> : <IconX size={20} />}
    </ThemeIcon>
  );

  return (
    <Card p="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="xl" fw={700}>
            Health Status
          </Text>
          <Group>
            {getHealthIcon(health.is_healthy)}
            {getHealthBadge(health.is_healthy)}
          </Group>
        </Group>

        <Grid>
          <Grid.Col span={3}>
            <Stack gap="xs">
              <Group gap="xs">
                <IconDatabase size={16} />
                <Text size="sm" c="dimmed">
                  Redis Connection
                </Text>
              </Group>
              <Badge
                color={health.redis_connection ? "green" : "red"}
                variant="light"
              >
                {health.redis_connection ? "Connected" : "Disconnected"}
              </Badge>
            </Stack>
          </Grid.Col>

          <Grid.Col span={3}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Worker Count
              </Text>
              <Text size="lg" fw={600}>
                {health.worker_count}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={3}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Queued Jobs
              </Text>
              <Text size="lg" fw={600}>
                {health.queued_job_count}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={3}>
            <Stack gap="xs">
              <Group gap="xs">
                <IconClock size={16} />
                <Text size="sm" c="dimmed">
                  Response Time
                </Text>
              </Group>
              <Text size="lg" fw={600}>
                {health.response_time_ms
                  ? `${health.response_time_ms}ms`
                  : "N/A"}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        {health.last_activity && (
          <Text size="sm" c="dimmed">
            Last Activity: {new Date(health.last_activity).toLocaleString()}
          </Text>
        )}

        {health.error_message && (
          <Paper bg="red.9" p="sm" radius="sm">
            <Text size="sm" c="red.1">
              Error: {health.error_message}
            </Text>
          </Paper>
        )}
      </Stack>
    </Card>
  );
}
