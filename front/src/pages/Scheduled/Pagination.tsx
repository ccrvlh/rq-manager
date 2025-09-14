import {
  Group,
  Pagination as MantinePagination,
  Select,
  Text,
} from "@mantine/core";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <Group justify="space-between" mt="md">
      <Text size="sm" c="dimmed">
        Showing {start}-{end} of {total} jobs
      </Text>
      <Group gap="sm">
        <Select
          value={limit.toString()}
          onChange={(value) => onLimitChange(Number(value))}
          data={[
            { value: "10", label: "10 per page" },
            { value: "25", label: "25 per page" },
            { value: "50", label: "50 per page" },
            { value: "100", label: "100 per page" },
          ]}
          size="sm"
        />
        <MantinePagination
          value={page}
          onChange={onPageChange}
          total={totalPages}
          size="sm"
        />
      </Group>
    </Group>
  );
}
