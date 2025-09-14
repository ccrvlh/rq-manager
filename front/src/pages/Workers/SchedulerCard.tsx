import { Scheduler } from "@/services/schedulersService";
import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

interface SchedulerCardProps {
  scheduler: Scheduler;
}

export function SchedulerCard({ scheduler }: SchedulerCardProps) {
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "green",
      inactive: "red",
      unknown: "gray",
    };
    return (
      <Badge color={colors[status] || "gray"} variant="light">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card
      shadow="md"
      padding="lg"
      radius="lg"
      withBorder
      style={{
        transition: "all 0.2s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      styles={{
        root: {
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
          },
        },
      }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="xs">
              <IconClock size={16} />
              <Text fw={600} size="lg" truncate>
                {scheduler.name}
              </Text>
            </Group>
            <Badge size="xs" color="yellow" variant="light">
              Scheduler
            </Badge>
          </Stack>
          {getStatusBadge(scheduler.status)}
        </Group>

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Hostname
            </Text>
            <Text size="sm" fw={500} truncate>
              {scheduler.hostname || "N/A"}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              PID
            </Text>
            <Text size="sm" fw={500}>
              {scheduler.pid || "N/A"}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Scheduled Jobs
            </Text>
            <Badge size="sm" variant="outline" color="blue">
              {scheduler.scheduled_jobs_count}
            </Badge>
          </Group>
        </Stack>

        <Group justify="space-between" align="center" mt="auto" pt="sm">
          <Text size="xs" c="dimmed">
            {scheduler.birth_date
              ? new Date(scheduler.birth_date).toLocaleDateString()
              : "Unknown"}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
