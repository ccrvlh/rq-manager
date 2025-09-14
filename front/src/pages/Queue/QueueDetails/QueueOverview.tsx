import { QueueDetails, QueuePriority, QueueStatus } from "@/pages/Queue/types";
import { Badge, Card, Grid, Group, Progress, Stack, Text } from "@mantine/core";

interface QueueOverviewProps {
  queue: QueueDetails;
}

export function QueueOverview({ queue }: QueueOverviewProps) {
  const getStatusBadge = (status: QueueStatus) => {
    const colors = {
      [QueueStatus.ACTIVE]: "green",
      [QueueStatus.PAUSED]: "yellow",
      [QueueStatus.FAILED]: "red",
      [QueueStatus.SCHEDULED]: "blue",
    };
    return (
      <Badge color={colors[status]} size="lg">
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: QueuePriority) => {
    const colors = {
      [QueuePriority.LOW]: "gray",
      [QueuePriority.NORMAL]: "blue",
      [QueuePriority.HIGH]: "orange",
      [QueuePriority.CRITICAL]: "red",
    };
    return (
      <Badge color={colors[priority]} variant="light" size="lg">
        {priority}
      </Badge>
    );
  };

  return (
    <Card p="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="xl" fw={700}>
            Queue Overview
          </Text>
          <Group>
            {getStatusBadge(queue.status)}
            {getPriorityBadge(queue.priority)}
          </Group>
        </Group>

        <Grid>
          <Grid.Col span={3}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Total Jobs
              </Text>
              <Text size="xl" fw={700}>
                {queue.queued_jobs +
                  queue.started_jobs +
                  queue.finished_jobs +
                  queue.failed_jobs +
                  queue.deferred_jobs +
                  queue.scheduled_jobs}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={3}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Failed Jobs
              </Text>
              <Text size="xl" fw={700} c="red">
                {queue.failed_jobs}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={3}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Deferred Jobs
              </Text>
              <Text size="xl" fw={700} c="yellow">
                {queue.deferred_jobs}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={3}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Scheduled Jobs
              </Text>
              <Text size="xl" fw={700} c="blue">
                {queue.scheduled_jobs}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Job Distribution
          </Text>
          {(() => {
            const total =
              queue.queued_jobs +
              queue.started_jobs +
              queue.finished_jobs +
              queue.failed_jobs +
              queue.deferred_jobs +
              queue.scheduled_jobs;
            if (total === 0)
              return (
                <Text size="sm" c="dimmed">
                  No jobs
                </Text>
              );

            return (
              <Progress.Root size="xl">
                {queue.queued_jobs > 0 && (
                  <Progress.Section
                    value={(queue.queued_jobs / total) * 100}
                    color="blue"
                  >
                    <Progress.Label>
                      Queued ({queue.queued_jobs})
                    </Progress.Label>
                  </Progress.Section>
                )}
                {queue.started_jobs > 0 && (
                  <Progress.Section
                    value={(queue.started_jobs / total) * 100}
                    color="orange"
                  >
                    <Progress.Label>
                      Running ({queue.started_jobs})
                    </Progress.Label>
                  </Progress.Section>
                )}
                {queue.finished_jobs > 0 && (
                  <Progress.Section
                    value={(queue.finished_jobs / total) * 100}
                    color="green"
                  >
                    <Progress.Label>
                      Finished ({queue.finished_jobs})
                    </Progress.Label>
                  </Progress.Section>
                )}
                {queue.failed_jobs > 0 && (
                  <Progress.Section
                    value={(queue.failed_jobs / total) * 100}
                    color="red"
                  >
                    <Progress.Label>
                      Failed ({queue.failed_jobs})
                    </Progress.Label>
                  </Progress.Section>
                )}
                {queue.deferred_jobs > 0 && (
                  <Progress.Section
                    value={(queue.deferred_jobs / total) * 100}
                    color="yellow"
                  >
                    <Progress.Label>
                      Deferred ({queue.deferred_jobs})
                    </Progress.Label>
                  </Progress.Section>
                )}
                {queue.scheduled_jobs > 0 && (
                  <Progress.Section
                    value={(queue.scheduled_jobs / total) * 100}
                    color="purple"
                  >
                    <Progress.Label>
                      Scheduled ({queue.scheduled_jobs})
                    </Progress.Label>
                  </Progress.Section>
                )}
              </Progress.Root>
            );
          })()}
        </Stack>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Created: {new Date(queue.created_at).toLocaleString()}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
