import { useDashboardWorkers } from "@/services/dashboardService";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

export function HomeWorkerStatus() {
  const navigate = useNavigate();
  const { data: workers } = useDashboardWorkers();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished":
        return "green";
      case "started":
        return "blue";
      case "failed":
        return "red";
      case "queued":
        return "orange";
      case "scheduled":
        return "yellow";
      case "active":
      case "busy":
        return "green";
      case "idle":
        return "yellow";
      case "dead":
        return "red";
      case "suspended":
        return "orange";
      default:
        return "gray";
    }
  };

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="transparent" size="lg">
            <IconUser size={16} />
          </ActionIcon>
          <Title order={4}>Worker Status</Title>
        </Group>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => navigate("/workers")}
        >
          Manage Workers
        </Button>
      </Group>

      <Stack gap="sm">
        {workers?.map((worker) => (
          <Card key={worker.id} padding="sm" withBorder>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>
                {worker.name}
              </Text>
              <Badge color={getStatusColor(worker.status)}>
                {worker.status}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Started {dayjs(worker.birth_date).fromNow()}
            </Text>
            {worker.current_job_func ? (
              <Text size="xs" mt="xs">
                <strong>{worker.current_job_func}</strong>
              </Text>
            ) : (
              <Text size="xs" mt="xs">
                Idle
              </Text>
            )}
          </Card>
        ))}
      </Stack>
    </Paper>
  );
}
