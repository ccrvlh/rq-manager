import { QueuePriority, QueueStatus } from "@/pages/Queue/types";
import { Group, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: QueueStatus | null;
  onStatusChange: (value: QueueStatus | null) => void;
  priorityFilter: QueuePriority | null;
  onPriorityChange: (value: QueuePriority | null) => void;
  onRefresh: () => void;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
}: SearchBarProps) {
  return (
    <Group gap="md" align="flex-end">
      <TextInput
        placeholder="Search queues..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        leftSection={<IconSearch size={14} />}
        style={{ flex: 1 }}
      />

      <Select
        placeholder="Filter by status"
        value={statusFilter}
        onChange={(value) => onStatusChange(value as QueueStatus | null)}
        data={[
          { value: QueueStatus.ACTIVE, label: "Active" },
          { value: QueueStatus.PAUSED, label: "Paused" },
          { value: QueueStatus.FAILED, label: "Failed" },
          { value: QueueStatus.SCHEDULED, label: "Scheduled" },
        ]}
        clearable
      />

      <Select
        placeholder="Filter by priority"
        value={priorityFilter}
        onChange={(value) => onPriorityChange(value as QueuePriority | null)}
        data={[
          { value: QueuePriority.LOW, label: "Low" },
          { value: QueuePriority.NORMAL, label: "Normal" },
          { value: QueuePriority.HIGH, label: "High" },
          { value: QueuePriority.CRITICAL, label: "Critical" },
        ]}
        clearable
      />
    </Group>
  );
}
