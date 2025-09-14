import { Group, Select, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  queue: string;
  onQueueChange: (value: string) => void;
  queues: string[];
}

export function SearchBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  queue,
  onQueueChange,
  queues,
}: SearchBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [debouncedSearch] = useDebouncedValue(localSearch, 200);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  return (
    <Group gap="md" align="flex-end">
      <TextInput
        placeholder="Search scheduled jobs..."
        value={localSearch}
        onChange={(event) => setLocalSearch(event.currentTarget.value)}
        leftSection={<IconSearch size={14} />}
        style={{ flex: 1 }}
      />
      <Select
        placeholder="Filter by status"
        value={status}
        onChange={(value) => onStatusChange(value || "")}
        data={[
          { value: "", label: "All statuses" },
          { value: "pending", label: "Pending" },
          { value: "overdue", label: "Overdue" },
        ]}
        clearable
      />
      <Select
        placeholder="Filter by queue"
        value={queue}
        onChange={(value) => onQueueChange(value || "")}
        data={[
          { value: "", label: "All queues" },
          ...queues.map((queue) => ({ value: queue, label: queue })),
        ]}
        clearable
      />
    </Group>
  );
}