import {
  Badge,
  Button,
  Card,
  Code,
  Divider,
  Drawer,
  Group,
  JsonInput,
  ScrollArea,
  Stack,
  Text,
  Timeline,
} from "@mantine/core";
import {
  IconBuilding,
  IconClock,
  IconRepeat,
  IconRoute,
  IconServer,
  IconUser,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { Job, JobStatus } from "./types";

interface JobDetailsDrawerProps {
  job: Job | null;
  opened: boolean;
  onClose: () => void;
  onRetry: (jobId: string) => void;
  onRemove: (jobId: string) => void;
}

export const JobDetailsDrawer: React.FC<JobDetailsDrawerProps> = ({
  job,
  opened,
  onClose,
  onRetry,
  onRemove,
}) => {
  const getTimelineStatus = (status: JobStatus | null | undefined) => {
    switch (status) {
      case JobStatus.FINISHED:
        return "green";
      case JobStatus.FAILED:
        return "red";
      case JobStatus.STARTED:
        return "blue";
      case JobStatus.QUEUED:
        return "yellow";
      case JobStatus.SCHEDULED:
        return "orange";
      case JobStatus.STOPPED:
        return "red";
      case JobStatus.CANCELED:
        return "red";
      case JobStatus.DEFERRED:
        return "orange";
      default:
        return "gray";
    }
  };

  const durationData = useMemo(() => {
    if (!job) return null;

    const created = new Date(job.created_at || Date.now());
    const updated = new Date(
      job.ended_at || job.enqueued_at || job.created_at || Date.now()
    );
    const duration = updated.getTime() - created.getTime();

    return {
      created: created,
      duration: duration,
      durationText: formatDistanceToNow(created, { addSuffix: true }),
    };
  }, [job]);

  if (!job) return null;

  const funcName = job.func_name || "Unknown Function";
  const timeout = job.timeout || 300000;
  const currentRetries = job.retry || 0;
  const maxRetries = job.max_retries || 3;
  const statusColor = getTimelineStatus(job.status);
  const statusLabel = (job.status || JobStatus.QUEUED).toUpperCase();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Job Details"
      padding="lg"
      size="lg"
      position="right"
      trapFocus
      lockScroll
      closeOnClickOutside
      closeOnEscape
      zIndex={9999}
      overlayProps={{ backgroundOpacity: 0.5 }}
    >
      <Stack gap="lg">
        {/* Combined Info Card */}
        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            {/* Header: Job ID and Status */}
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" fw={500} c="dimmed">
                  Job ID
                </Text>
                <Code style={{ fontSize: "12px" }}>{job.id}</Code>
              </div>
              <Badge color={statusColor} variant="light" size="lg">
                {statusLabel}
              </Badge>
            </Group>

            {/* Function Info */}
            <Group>
              <IconBuilding size={16} />
              <div>
                <Text size="xs" fw={500} c="dimmed">
                  Function
                </Text>
                <Text size="sm">{funcName}</Text>
              </div>
            </Group>

            <Divider />

            <Stack gap="sm">
              {/* Queue Info */}
              <Group>
                <IconServer size={16} />
                <div>
                  <Text size="xs" fw={500} c="dimmed">
                    Queue
                  </Text>
                  <Text size="sm">{job.queue || "default"}</Text>
                </div>
              </Group>

              {/* Worker Info */}
              <Group>
                <IconUser size={16} />
                <div>
                  <Text size="xs" fw={500} c="dimmed">
                    Worker
                  </Text>
                  <Text size="sm">{job.worker_name || "Unassigned"}</Text>
                </div>
              </Group>

              {/* Timeout Info */}
              <Group>
                <IconClock size={16} />
                <div>
                  <Text size="xs" fw={500} c="dimmed">
                    Timeout
                  </Text>
                  <Text size="sm">{timeout}ms</Text>
                </div>
              </Group>

              {/* Retries Info */}
              <Group>
                <IconRepeat size={16} />
                <div>
                  <Text size="xs" fw={500} c="dimmed">
                    Retries
                  </Text>
                  <Text size="sm">
                    {currentRetries}/{maxRetries}
                  </Text>
                </div>
              </Group>

              {/* Origin Info */}
              <Group>
                <IconRoute size={16} />
                <div>
                  <Text size="xs" fw={500} c="dimmed">
                    Origin
                  </Text>
                  <Text size="sm">{job.origin || "Queue"}</Text>
                </div>
              </Group>
            </Stack>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text size="sm" fw={500} mb="sm">
            Timeline
          </Text>
          <Timeline active={1} bulletSize={12} lineWidth={2}>
            <Timeline.Item
              bullet={<span />}
              title="Created"
              color={statusColor}
            >
              <Text size="xs" c="dimmed">
                {durationData?.created.toLocaleString()}
              </Text>
            </Timeline.Item>

            {job.enqueued_at && (
              <Timeline.Item bullet={<span />} title="Enqueued" color="blue">
                <Text size="xs" c="dimmed">
                  {new Date(job.enqueued_at).toLocaleString()}
                </Text>
              </Timeline.Item>
            )}

            {job.started_at && (
              <Timeline.Item bullet={<span />} title="Started" color="blue">
                <Text size="xs" c="dimmed">
                  Started processing at{" "}
                  {new Date(job.started_at).toLocaleString()}
                </Text>
              </Timeline.Item>
            )}

            {job.ended_at && (
              <Timeline.Item
                bullet={<span />}
                title={
                  job.status === JobStatus.FINISHED ? "Completed" : "Ended"
                }
                color={job.status === JobStatus.FINISHED ? "green" : "red"}
              >
                <Text size="xs" c="dimmed">
                  {new Date(job.ended_at).toLocaleString()}
                </Text>
              </Timeline.Item>
            )}
          </Timeline>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Text size="sm" fw={500} mb="sm">
            Job Data
          </Text>
          {job.args?.length || job.kwargs ? (
            <JsonInput
              value={JSON.stringify(
                { args: job.args || [], kwargs: job.kwargs || {} },
                null,
                2
              )}
              autosize
              minRows={4}
              readOnly
              inputSize="xs"
            />
          ) : (
            <Text size="sm" c="dimmed">
              No job data provided
            </Text>
          )}
        </Card>

        {job.result !== null && job.result !== undefined && (
          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={500} mb="sm">
              Result
            </Text>
            <JsonInput
              value={JSON.stringify(job.result, null, 2)}
              autosize
              minRows={4}
              readOnly
            />
          </Card>
        )}

        {job.exc_info && (
          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={500} mb="sm">
              Error
            </Text>
            <ScrollArea h={200}>
              <Code block>{job.exc_info}</Code>
            </ScrollArea>
          </Card>
        )}

        {job.traceback && (
          <Card withBorder padding="lg" radius="md">
            <Text size="sm" fw={500} mb="sm">
              Traceback
            </Text>
            <ScrollArea h={200}>
              <Code block>{job.traceback}</Code>
            </ScrollArea>
          </Card>
        )}

        <Group justify="space-between" mt="xl">
          <Group>
            <Button variant="light" onClick={() => onRetry(job.id)}>
              Retry Job
            </Button>
            <Button variant="light" onClick={() => onRemove(job.id)}>
              Remove Job
            </Button>
          </Group>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
