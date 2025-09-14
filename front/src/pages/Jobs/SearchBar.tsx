import { Group, MultiSelect, Select, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { JobStatus } from "./types";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  queue: string | string[];
  onQueueChange: (value: string | string[]) => void;
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
        placeholder="Search jobs..."
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
          ...Object.values(JobStatus).map((status) => ({
            value: status,
            label: status.charAt(0).toUpperCase() + status.slice(1),
          })),
        ]}
        clearable
      />
      <MultiSelect
        placeholder="Filter by queues"
        value={Array.isArray(queue) ? queue : queue ? [queue] : []}
        onChange={(value) => onQueueChange(value)}
        data={queues.map((queue) => ({ value: queue, label: queue }))}
        clearable
        searchable
      />
    </Group>
  );
}
