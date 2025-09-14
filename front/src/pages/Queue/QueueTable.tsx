import { Queue, QueuePriority, QueueStatus } from "@/pages/Queue/types";
import { getQueueDetailsRoute } from "@/routes";
import { useQueues } from "@/services/queuesService";
import {
  ActionIcon,
  Badge,
  Checkbox,
  Flex,
  Group,
  Loader,
  Table,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconStack2,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface QueueTableProps {
  searchTerm: string;
  statusFilter: QueueStatus | null;
  priorityFilter: QueuePriority | null;
  selectedQueues?: string[];
  onQueueSelect?: (queueName: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

export function QueueTable({
  searchTerm,
  statusFilter,
  priorityFilter,
  selectedQueues = [],
  onQueueSelect,
  onSelectAll,
}: QueueTableProps) {
  const [page] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const params = {
    search: searchTerm,
    status: statusFilter,
    priority: priorityFilter,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    sort_by: "name",
    sort_order: "asc" as const,
  };

  const { data: queuesResponse, isLoading, error } = useQueues(params);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h={300}>
        <Loader size="lg" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" h={300}>
        <Text c="red">Failed to load queues: {(error as Error).message}</Text>
      </Flex>
    );
  }

  const queues =
    queuesResponse?.data && Array.isArray(queuesResponse.data)
      ? queuesResponse.data
      : [];

  const getStatusColor = (status: QueueStatus) => {
    const colors = {
      [QueueStatus.ACTIVE]: "green",
      [QueueStatus.PAUSED]: "yellow",
      [QueueStatus.FAILED]: "red",
      [QueueStatus.SCHEDULED]: "blue",
    };
    return colors[status];
  };

  const getStatusBadge = (status: QueueStatus) => {
    return <Badge color={getStatusColor(status)}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: QueuePriority) => {
    const colors = {
      [QueuePriority.LOW]: "gray",
      [QueuePriority.NORMAL]: "blue",
      [QueuePriority.HIGH]: "orange",
      [QueuePriority.CRITICAL]: "red",
    };
    return (
      <Badge color={colors[priority]} variant="light">
        {priority}
      </Badge>
    );
  };

  const handleQueueAction = (queueName: string, action: string) => {
    notifications.show({
      title: action.charAt(0).toUpperCase() + action.slice(1),
      message: `${action} queue ${queueName}`,
      color: "blue",
    });
  };

  const rows = queues.map((queue: Queue) => (
    <Table.Tr
      key={queue.name}
      style={{ cursor: "pointer" }}
      onClick={() => navigate(getQueueDetailsRoute(queue.name))}
    >
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selectedQueues.includes(queue.name)}
          onChange={(event) =>
            onQueueSelect?.(queue.name, event.currentTarget.checked)
          }
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color={getStatusColor(queue.status)}
          size="md"
        >
          <IconStack2 size={14} />
        </ActionIcon>
      </Table.Td>
      <Table.Td>
        <Text fw={700} size="sm" c="blue">
          {queue.name}
        </Text>
      </Table.Td>
      <Table.Td>{getStatusBadge(queue.status)}</Table.Td>
      <Table.Td>{getPriorityBadge(queue.priority)}</Table.Td>
      <Table.Td>
        <Text size="sm">{queue.count}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="red">
          {queue.failed_jobs}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="green">
          {queue.finished_jobs}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {queue.count + queue.failed_jobs + queue.finished_jobs}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {new Date(queue.created_at).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {queue.status === QueueStatus.ACTIVE ? (
            <ActionIcon
              color="yellow"
              variant="subtle"
              title="Pause queue"
              onClick={(e) => {
                e.stopPropagation();
                handleQueueAction(queue.name, "pause");
              }}
            >
              <IconPlayerPause size={14} />
            </ActionIcon>
          ) : queue.status === QueueStatus.PAUSED ? (
            <ActionIcon
              color="green"
              variant="subtle"
              title="Resume queue"
              onClick={(e) => {
                e.stopPropagation();
                handleQueueAction(queue.name, "resume");
              }}
            >
              <IconPlayerPlay size={14} />
            </ActionIcon>
          ) : null}
          <ActionIcon
            color="red"
            variant="subtle"
            title="Empty queue"
            onClick={(e) => {
              e.stopPropagation();
              handleQueueAction(queue.name, "empty");
            }}
          >
            <IconRefresh size={14} />
          </ActionIcon>
          <ActionIcon
            color="red"
            variant="subtle"
            title="Delete queue"
            onClick={(e) => {
              e.stopPropagation();
              handleQueueAction(queue.name, "delete");
            }}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox
              checked={
                selectedQueues.length === queues.length && queues.length > 0
              }
              indeterminate={
                selectedQueues.length > 0 &&
                selectedQueues.length < queues.length
              }
              onChange={(event) => onSelectAll?.(event.currentTarget.checked)}
            />
          </Table.Th>
          <Table.Th w={30}></Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Priority</Table.Th>
          <Table.Th>Active</Table.Th>
          <Table.Th>Failed</Table.Th>
          <Table.Th>Finished</Table.Th>
          <Table.Th>Total</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.length > 0 ? (
          rows
        ) : (
          <Table.Tr>
            <Table.Td colSpan={11}>
              <Text ta="center" c="dimmed" py="lg">
                No queues found
              </Text>
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
