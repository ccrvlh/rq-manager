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
  return (
    <Group justify="space-between" align="center" c="dimmed">
      <Text size="sm">
        {total === 0 ? (
          "No jobs found"
        ) : (
          <>
            {total} job{total !== 1 ? "s" : ""} found
          </>
        )}
      </Text>

      <Group>
        <Select
          value={limit.toString()}
          onChange={(value) => onLimitChange(parseInt(value || "25", 10))}
          data={["10", "25", "50", "100"]}
          w="150px"
        />

        <MantinePagination
          value={page}
          onChange={onPageChange}
          total={totalPages}
          siblings={1}
          boundaries={1}
        />
      </Group>
    </Group>
  );
}
