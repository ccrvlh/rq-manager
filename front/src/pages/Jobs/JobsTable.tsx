import {
  ActionIcon,
  Badge,
  Checkbox,
  Group,
  rem,
  ScrollArea,
  Table,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { IconStack, IconTool, IconUser } from "@tabler/icons-react";
import { format, formatDistanceToNow } from "date-fns";
import { getJobKey } from "./jobUtils";
import { Job, JobStatus } from "./types";

interface JobsTableProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  selectedJobKey?: string;
  selectedJobs?: string[];
  onJobSelect?: (jobKey: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

export function JobsTable({
  jobs,
  onJobClick,
  selectedJobKey,
  selectedJobs = [],
  onJobSelect,
  onSelectAll,
}: JobsTableProps) {
  const { colorScheme } = useMantineColorScheme();
  const getStatusColor = (status?: JobStatus | null) => {
    switch (status) {
      case JobStatus.QUEUED:
        return "yellow";
      case JobStatus.STARTED:
        return "blue";
      case JobStatus.FINISHED:
        return "green";
      case JobStatus.FAILED:
        return "red";
      case JobStatus.DEFERRED:
        return "orange";
      case JobStatus.SCHEDULED:
        return "cyan";
      case JobStatus.STOPPED:
      case JobStatus.CANCELED:
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status?: JobStatus | null) => {
    switch (status) {
      case JobStatus.QUEUED:
        return "Queued";
      case JobStatus.STARTED:
        return "Running";
      case JobStatus.FINISHED:
        return "Completed";
      case JobStatus.FAILED:
        return "Failed";
      case JobStatus.DEFERRED:
        return "Deferred";
      case JobStatus.SCHEDULED:
        return "Scheduled";
      case JobStatus.STOPPED:
        return "Stopped";
      case JobStatus.CANCELED:
        return "Canceled";
      default:
        return status || "Unknown";
    }
  };

  const formatFunctionName = (funcName: string) => {
    return funcName.split(".").pop() || funcName;
  };

  return (
    <ScrollArea>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                checked={selectedJobs.length === jobs.length && jobs.length > 0}
                indeterminate={
                  selectedJobs.length > 0 && selectedJobs.length < jobs.length
                }
                onChange={(event) => onSelectAll?.(event.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th w={30}></Table.Th>
            <Table.Th>Job</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Queue</Table.Th>
            <Table.Th>Function</Table.Th>
            <Table.Th>Worker</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Started</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {jobs.map((job) => {
            const jobKey = getJobKey(job);
            return (
              <Table.Tr
                key={jobKey}
                style={{ cursor: "pointer" }}
                bg={
                  selectedJobKey === jobKey
                    ? colorScheme === "dark"
                      ? "var(--mantine-color-gray-9)"
                      : "var(--mantine-color-gray-2)"
                    : undefined
                }
                onClick={() => onJobClick(job)}
              >
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedJobs.includes(jobKey)}
                    onChange={(event) =>
                      onJobSelect?.(jobKey, event.currentTarget.checked)
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    variant="subtle"
                    color={getStatusColor(job.status)}
                    size="md"
                  >
                    <IconTool size={14} />
                  </ActionIcon>
                </Table.Td>
                <Table.Td>
                  <div>
                    <Text fw={500} size="sm">
                      {formatFunctionName(job.func_name)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {job.id.substring(0, 8)}...
                    </Text>
                  </div>
                </Table.Td>

                <Table.Td>
                  <Badge
                    color={getStatusColor(job.status)}
                    variant="light"
                    size="sm"
                  >
                    {getStatusLabel(job.status)}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Badge variant="light" color="gray">
                    <Group gap={4} wrap="nowrap" align="center">
                      <IconStack size={12} />
                      <Text
                        size="xs"
                        fw="bold"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {job.queue || "default"}
                      </Text>
                    </Group>
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Badge
                    variant="dot"
                    size="xs"
                    color="dimmed"
                    styles={{
                      root: {
                        fontFamily: "Menlo, Monaco, 'Consolas', monospace",
                        fontSize: "11px",
                        textTransform: "none",
                        lineHeight: "16px",
                      },
                    }}
                  >
                    {formatFunctionName(job.func_name)}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Group gap={4} wrap="nowrap" align="center">
                    <IconUser size={12} />
                    <Text size="xs" truncate style={{ maxWidth: rem(150) }}>
                      {job.worker_name || "-"}
                    </Text>
                  </Group>
                </Table.Td>

                <Table.Td>
                  {job.created_at ? (
                    <Tooltip
                      label={format(
                        new Date(job.created_at),
                        "MMM dd, yyyy 'at' HH:mm:ss"
                      )}
                    >
                      <Text size="xs" style={{ whiteSpace: "nowrap" }}>
                        {formatDistanceToNow(new Date(job.created_at), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text size="xs">-</Text>
                  )}
                </Table.Td>

                <Table.Td>
                  {job.started_at ? (
                    <Tooltip
                      label={format(
                        new Date(job.started_at),
                        "MMM dd, yyyy 'at' HH:mm:ss"
                      )}
                    >
                      <Text size="xs" style={{ whiteSpace: "nowrap" }}>
                        {formatDistanceToNow(new Date(job.started_at), {
                          addSuffix: true,
                        })}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text size="xs">-</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
