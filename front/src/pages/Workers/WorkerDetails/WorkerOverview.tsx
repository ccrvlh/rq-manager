import { Worker } from "@/services/workersService";
import {
  ActionIcon,
  Badge,
  Card,
  Grid,
  Group,
  rem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBriefcase,
  IconCalendar,
  IconCheck,
  IconCircleDot,
  IconCode,
  IconHash,
  IconHeartbeat,
  IconPercentage,
  IconServer,
  IconSum,
  IconX,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface WorkerOverviewProps {
  worker: Worker;
}

export function WorkerOverview({ worker }: WorkerOverviewProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      busy: "orange",
      idle: "green",
      started: "blue",
      suspended: "yellow",
      busy_long: "red",
      dead: "gray",
    };
    return (
      <Badge color={colors[status as keyof typeof colors] || "gray"}>
        {status}
      </Badge>
    );
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Stack gap="md">
      <Title order={2}>Worker Overview</Title>

      <Grid>
        <Grid.Col span={6}>
          <Card withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconCircleDot size={12} />
                  </ActionIcon>
                  <Text size="xs" fw={500} c="dimmed">
                    Status
                  </Text>
                </Group>
                {getStatusBadge(worker.status)}
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconServer size={12} />
                  </ActionIcon>
                  <Text size="sm" fw={500} c="dimmed">
                    Hostname
                  </Text>
                </Group>
                <Text>{worker.hostname || "Unknown"}</Text>
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconHash size={12} />
                  </ActionIcon>
                  <Text size="sm" fw={500} c="dimmed">
                    Process ID
                  </Text>
                </Group>
                <Text>{worker.pid || "N/A"}</Text>
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconCode size={12} />
                  </ActionIcon>
                  <Text size="sm" fw={500} c="dimmed">
                    Python Version
                  </Text>
                </Group>
                <Text truncate style={{ maxWidth: rem(175) }}>
                  {worker.python_version || "Unknown"}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconSum size={12} />
                  </ActionIcon>
                  <Text size="xs" fw={500} c="dimmed">
                    Total Jobs
                  </Text>
                </Group>
                <Text>{worker.total_jobs}</Text>
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconCheck size={12} />
                  </ActionIcon>
                  <Text size="xs" fw={500} c="dimmed">
                    Successful Jobs
                  </Text>
                </Group>
                <Text c="green">{worker.successful_jobs}</Text>
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconX size={12} />
                  </ActionIcon>
                  <Text size="xs" fw={500} c="dimmed">
                    Failed Jobs
                  </Text>
                </Group>
                <Text c="red">{worker.failed_jobs}</Text>
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconPercentage size={12} />
                  </ActionIcon>
                  <Text size="xs" fw={500} c="dimmed">
                    Success Rate
                  </Text>
                </Group>
                <Text>
                  {worker.total_jobs > 0
                    ? `${(
                        (worker.successful_jobs / worker.total_jobs) *
                        100
                      ).toFixed(1)}%`
                    : "N/A"}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card p="md" radius="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>Queues</Text>
              <Group gap="xs">
                {worker.queues?.map((queue) => (
                  <Badge key={queue} variant="outline">
                    {queue}
                  </Badge>
                )) || <Text c="dimmed">No queues assigned</Text>}
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconCalendar size={12} />
                  </ActionIcon>
                  <Text size="sm" fw={500} c="dimmed">
                    Birth Date
                  </Text>
                </Group>
                <Text>{formatTime(worker.birth_date)}</Text>
              </Group>

              <Group justify="space-between">
                <Group gap="2">
                  <ActionIcon variant="subtle">
                    <IconHeartbeat size={12} />
                  </ActionIcon>
                  <Text size="sm" fw={500} c="dimmed">
                    Last Heartbeat
                  </Text>
                </Group>
                <Text>{formatTime(worker.last_heartbeat)}</Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card p="md" radius="md" withBorder>
            <Stack gap="md">
              {worker.current_job_func ? (
                <>
                  <Group gap="2">
                    <ActionIcon variant="subtle">
                      <IconBriefcase size={12} />
                    </ActionIcon>
                    <Text size="xs" fw={500} c="dimmed">
                      Current Job
                    </Text>
                  </Group>
                  <Stack gap="xs">
                    <Text size="sm">{worker.current_job_func}</Text>
                    <Text size="sm" c="dimmed">
                      ID: {worker.current_job_id}
                    </Text>
                    {worker.busy_since && (
                      <Text size="sm" c="dimmed">
                        Running for: {formatTime(worker.busy_since)}
                      </Text>
                    )}
                  </Stack>
                </>
              ) : (
                <>
                  <Group gap="2">
                    <ActionIcon variant="subtle">
                      <IconBriefcase size={12} />
                    </ActionIcon>
                    <Text size="xs" fw={500} c="dimmed">
                      Current Job
                    </Text>
                  </Group>
                  <Text c="dimmed">No active job</Text>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
