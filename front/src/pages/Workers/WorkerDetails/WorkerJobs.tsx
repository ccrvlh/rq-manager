import {
  ActionIcon,
  Badge,
  Card,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconStack, IconTool } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { JobStatus } from "../../Jobs/types";

interface Job {
  id: string;
  func_name: string;
  status: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  queue_name: string;
}

interface WorkerJobsProps {
  jobs: Job[];
}

export function WorkerJobs({ jobs }: WorkerJobsProps) {
  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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
    <Stack gap="md">
      <Title order={2}>Worker Jobs</Title>

      {jobs.length === 0 ? (
        <Card p="md" radius="md" withBorder>
          <Stack align="center" gap="md">
            <Text size="lg">No jobs found</Text>
            <Text size="sm" c="dimmed">
              This worker has no associated jobs
            </Text>
          </Stack>
        </Card>
      ) : (
        <Card radius="md" withBorder>
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={30}></Table.Th>
                  <Table.Th>Job</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Queue</Table.Th>
                  <Table.Th>Function</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Started</Table.Th>
                  <Table.Th>Ended</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {jobs.map((job) => (
                  <Table.Tr key={job.id}>
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
                        <Group gap={0}>
                          <ActionIcon variant="subtle" p="0">
                            <IconStack size={12} />
                          </ActionIcon>
                          <Text size="xs" fw="bold">
                            {job.queue_name || "default"}
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
                      <Text size="xs">
                        {job.created_at &&
                          formatDistanceToNow(new Date(job.created_at), {
                            addSuffix: true,
                          })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">
                        {job.started_at
                          ? formatDistanceToNow(new Date(job.started_at), {
                              addSuffix: true,
                            })
                          : "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">
                        {job.ended_at
                          ? formatDistanceToNow(new Date(job.ended_at), {
                              addSuffix: true,
                            })
                          : "-"}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </Stack>
  );
}
