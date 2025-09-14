import { useSchedulers } from "@/services/schedulersService";
import {
  useWorkerCounts,
  useWorkers,
  WorkerListFilters,
} from "@/services/workersService";
import {
  ActionIcon,
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
import { IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { SchedulerCard } from "./SchedulerCard";
import { SearchBar } from "./SearchBar";
import { WorkerCard } from "./WorkerCard";
import { WorkerTable } from "./WorkerTable";

export function Workers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [hostnameFilter, setHostnameFilter] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "grid">("grid");
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  const params: WorkerListFilters = {
    search: searchTerm,
    status: statusFilter || undefined,
    hostname: hostnameFilter || undefined,
    limit: 50,
    offset: 0,
  };

  const { data: workers = [], isLoading, refetch } = useWorkers(params);
  const { data: counts } = useWorkerCounts();
  const { data: schedulers = [], refetch: refetchSchedulers } = useSchedulers();

  const handleRefresh = () => {
    refetch();
    refetchSchedulers();
    notifications.show({
      title: "Workers & Schedulers refreshed",
      message: "Data has been updated",
      color: "green",
    });
  };

  const handleWorkerSelect = (workerId: string, selected: boolean) => {
    setSelectedWorkers((prev) =>
      selected ? [...prev, workerId] : prev.filter((id) => id !== workerId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedWorkers(selected ? workers.map((worker) => worker.id) : []);
  };

  return (
    <Container size="xl" fluid>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title order={1}>Workers & Schedulers</Title>
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
              {counts?.total || 0} total workers
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
          </Group>
        </Group>

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          hostnameFilter={hostnameFilter}
          onHostnameChange={setHostnameFilter}
          onRefresh={handleRefresh}
        />

        <Stack gap="md">
          <Group>
            <Title order={3}>Workers</Title>
            <Text size="sm" c="dimmed">
              {workers.length} worker{workers.length !== 1 ? "s" : ""}
            </Text>
          </Group>
          {view === "table" ? (
            <Paper shadow="sm" p="md" withBorder>
              <WorkerTable
                workers={workers}
                isLoading={isLoading}
                selectedWorkers={selectedWorkers}
                onWorkerSelect={handleWorkerSelect}
                onSelectAll={handleSelectAll}
              />
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {workers.map((worker) => (
                <WorkerCard key={worker.name} worker={worker} />
              ))}
            </SimpleGrid>
          )}
        </Stack>

        {schedulers.length > 0 && (
          <Stack gap="md">
            <Group>
              <Title order={3}>Schedulers</Title>
              <Text size="sm" c="dimmed">
                {schedulers.length} scheduler
                {schedulers.length !== 1 ? "s" : ""}
              </Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {schedulers.map((scheduler) => (
                <SchedulerCard key={scheduler.id} scheduler={scheduler} />
              ))}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
