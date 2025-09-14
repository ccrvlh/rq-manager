import { getWorkerDetailsRoute } from "@/routes";
import { Worker } from "@/services/workers/workersService";
import {
  ActionIcon,
  Badge,
  Checkbox,
  Group,
  Paper,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconClock, IconUser } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface WorkerTableProps {
  workers: Worker[];
  isLoading: boolean;
  selectedWorkers?: string[];
  onWorkerSelect?: (workerId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

export function WorkerTable({
  workers,
  isLoading,
  selectedWorkers = [],
  onWorkerSelect,
  onSelectAll,
}: WorkerTableProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    const colors = {
      busy: "orange",
      idle: "green",
      started: "blue",
      suspended: "yellow",
      busy_long: "red",
      dead: "gray",
    };
    return colors[status as keyof typeof colors] || "gray";
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "dead" ? "filled" : "light";
    return (
      <Badge color={getStatusColor(status)} variant={variant}>
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

  if (isLoading) {
    return (
      <Paper p="md" radius="md">
        <Text>Loading workers...</Text>
      </Paper>
    );
  }

  if (workers.length === 0) {
    return (
      <Paper p="md" radius="md">
        <Stack align="center" gap="md">
          <Text size="lg">No workers found</Text>
          <Text size="sm" c="dimmed">
            No workers are currently running or match your filters
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox
              checked={
                selectedWorkers.length === workers.length && workers.length > 0
              }
              indeterminate={
                selectedWorkers.length > 0 &&
                selectedWorkers.length < workers.length
              }
              onChange={(event) => onSelectAll?.(event.currentTarget.checked)}
            />
          </Table.Th>
          <Table.Th w={30}></Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Hostname</Table.Th>
          <Table.Th>Queues</Table.Th>
          <Table.Th>Current Job</Table.Th>
          <Table.Th>Jobs Processed</Table.Th>
          <Table.Th>Last Heartbeat</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {workers.map((worker) => (
          <Table.Tr key={worker.id}>
            <Table.Td onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedWorkers.includes(worker.id)}
                onChange={(event) =>
                  onWorkerSelect?.(worker.id, event.currentTarget.checked)
                }
              />
            </Table.Td>
            <Table.Td>
              <ActionIcon
                variant="subtle"
                color={getStatusColor(worker.status)}
                size="md"
              >
                <IconUser size={14} />
              </ActionIcon>
            </Table.Td>
            <Table.Td>
              <Stack gap={2}>
                <Group gap="xs">
                  <Text
                    fw={500}
                    c="blue"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(getWorkerDetailsRoute(worker.id))}
                  >
                    {worker.name}
                  </Text>
                  {worker.is_scheduler && (
                    <Badge
                      size="xs"
                      color="purple"
                      variant="light"
                      leftSection={<IconClock size={10} />}
                    >
                      Scheduler
                    </Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  PID: {worker.pid || "N/A"}
                </Text>
              </Stack>
            </Table.Td>
            <Table.Td>{getStatusBadge(worker.status)}</Table.Td>
            <Table.Td>
              <Text size="sm">{worker.hostname || "Unknown"}</Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                {worker.queues?.map((queue) => (
                  <Badge key={queue} size="sm" variant="outline">
                    {queue}
                  </Badge>
                )) || (
                  <Text size="sm" c="dimmed">
                    None
                  </Text>
                )}
              </Group>
            </Table.Td>
            <Table.Td>
              {worker.current_job_func ? (
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {worker.current_job_func}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ID: {worker.current_job_id}
                  </Text>
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  No active job
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              <Stack gap={2}>
                <Text size="sm">Total: {worker.total_jobs}</Text>
                <Group gap="xs">
                  <Text size="xs" c="green">
                    ✓ {worker.successful_jobs}
                  </Text>
                  <Text size="xs" c="red">
                    ✗ {worker.failed_jobs}
                  </Text>
                </Group>
              </Stack>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatTime(worker.last_heartbeat)}</Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
