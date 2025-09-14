import {
  QueueDetails,
  QueueListFilters,
  QueuePriority,
  QueueStatus,
  Queue as QueueType,
} from "@/pages/Queue/types";
import { useQueues } from "@/services/queues/queuesService";
import {
  ActionIcon,
  Button,
  Container,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { CreateQueueModal } from "./CreateQueueModal";
import { QueueCard } from "./QueueCard";
import { QueueTable } from "./QueueTable";
import { SearchBar } from "./SearchBar";

export function Queue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueueStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<QueuePriority | null>(
    null
  );
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [view, setView] = useState<"table" | "grid">("grid");
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);

  const params: QueueListFilters = {
    search: searchTerm,
    status: statusFilter,
    priority: priorityFilter,
    limit: 50,
    offset: 0,
    sort_by: "name",
    sort_order: "asc" as const,
  };

  const { data: queuesResponse, isLoading, refetch } = useQueues(params);

  const total = queuesResponse?.total || 0;

  const handleRefresh = () => {
    refetch();
    notifications.show({
      title: "Queues refreshed",
      message: "Queue data has been updated",
      color: "green",
    });
  };

  const handleQueueSelect = (queueName: string, selected: boolean) => {
    setSelectedQueues((prev) =>
      selected
        ? [...prev, queueName]
        : prev.filter((name) => name !== queueName)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedQueues(
      selected
        ? queuesResponse?.data?.map((queue: QueueType) => queue.name) || []
        : []
    );
  };

  return (
    <Container size="xl" fluid>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title order={1}>Queues</Title>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={handleRefresh}
              title="Refresh"
              size="sm"
              loading={isLoading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {total} total queues
            </Text>
          </Group>
          <Group>
            <SegmentedControl
              value={view}
              onChange={(value) => setView(value as "table" | "grid")}
              data={[
                { label: "Table", value: "table" },
                { label: "Grid", value: "grid" },
              ]}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpened(true)}
            >
              Create Queue
            </Button>
          </Group>
        </Group>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onRefresh={handleRefresh}
        />

        {view === "table" ? (
          <Paper shadow="sm" p="md" withBorder>
            <QueueTable
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              selectedQueues={selectedQueues}
              onQueueSelect={handleQueueSelect}
              onSelectAll={handleSelectAll}
            />
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {queuesResponse?.data?.map((queue: QueueDetails) => (
              <QueueCard key={queue.name} queue={queue} />
            )) || []}
          </SimpleGrid>
        )}

        <CreateQueueModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
          onSuccess={() => {
            setCreateModalOpened(false);
            refetch();
            notifications.show({
              title: "Queue created",
              message: "Queue was created successfully",
              color: "green",
            });
          }}
        />
      </Stack>
    </Container>
  );
}
