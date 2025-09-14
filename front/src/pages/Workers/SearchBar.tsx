import { ActionIcon, Group, Select, TextInput } from "@mantine/core";
import { IconRefresh, IconSearch } from "@tabler/icons-react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string | null;
  onStatusChange: (value: string | null) => void;
  hostnameFilter: string | null;
  onHostnameChange: (value: string | null) => void;
  onRefresh: () => void;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  hostnameFilter,
  onHostnameChange,
  onRefresh,
}: SearchBarProps) {
  return (
    <Group gap="md" align="flex-end">
      <TextInput
        placeholder="Search workers..."
        leftSection={<IconSearch size={14} />}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        style={{ flex: 1 }}
      />
      <Select
        placeholder="Filter by status"
        data={[
          { value: "busy", label: "Busy" },
          { value: "idle", label: "Idle" },
          { value: "started", label: "Started" },
          { value: "suspended", label: "Suspended" },
          { value: "dead", label: "Dead" },
        ]}
        value={statusFilter}
        onChange={onStatusChange}
        clearable
      />
      <TextInput
        placeholder="Filter by hostname"
        value={hostnameFilter || ""}
        onChange={(e) => onHostnameChange(e.currentTarget.value || null)}
      />
      <ActionIcon
        variant="subtle"
        color="blue"
        onClick={onRefresh}
        title="Refresh"
      >
        <IconRefresh size={16} />
      </ActionIcon>
    </Group>
  );
}
