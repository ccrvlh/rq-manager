import { ScheduledJob } from "@/services/scheduledJobsService";
import { parseCronExpression } from "@/utils/cronParser";
import {
  Badge,
  Code,
  Divider,
  Drawer,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconCalendar,
  IconClock,
  IconHash,
  IconRepeat,
} from "@tabler/icons-react";

interface ScheduledJobDrawerProps {
  job: ScheduledJob | null;
  opened: boolean;
  onClose: () => void;
}

export function ScheduledJobDrawer({
  job,
  opened,
  onClose,
}: ScheduledJobDrawerProps) {
  if (!job) return null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Scheduled Job Details"
      size="lg"
      position="right"
      padding="lg"
      trapFocus
      lockScroll
      closeOnClickOutside
      closeOnEscape
      zIndex={9999}
      overlayProps={{ backgroundOpacity: 0.5 }}
    >
      <Stack gap="md">
        <Group gap="xs">
          <Text fw={600} size="lg">
            {job.func_name}
          </Text>
          <Badge variant="light">{job.queue}</Badge>
        </Group>

        {job.description && <Text c="dimmed">{job.description}</Text>}

        <Divider />

        <Stack gap="sm">
          <Group gap="xs">
            <IconHash size={16} />
            <Text fw={500}>Job ID:</Text>
            <Code>{job.id}</Code>
          </Group>

          {job.scheduled_for && (
            <Group gap="xs">
              <IconCalendar size={16} />
              <Text fw={500}>Scheduled For:</Text>
              <Text>{new Date(job.scheduled_for).toLocaleString()}</Text>
            </Group>
          )}

          {job.cron && (
            <Stack gap="xs">
              <Group gap="xs">
                <IconRepeat size={16} />
                <Text fw={500}>Cron Expression:</Text>
                <Code>{job.cron}</Code>
              </Group>
              <Text size="sm" c="dimmed" pl="md">
                {parseCronExpression(job.cron)}
              </Text>
            </Stack>
          )}

          {job.interval && (
            <Group gap="xs">
              <IconClock size={16} />
              <Text fw={500}>Interval:</Text>
              <Text>{job.interval} seconds</Text>
            </Group>
          )}

          {job.repeat && (
            <Group gap="xs">
              <IconRepeat size={16} />
              <Text fw={500}>Repeat:</Text>
              <Text>{job.repeat} times</Text>
            </Group>
          )}

          {job.timeout && (
            <Group gap="xs">
              <IconClock size={16} />
              <Text fw={500}>Timeout:</Text>
              <Text>{job.timeout} seconds</Text>
            </Group>
          )}
        </Stack>

        {job.args && job.args.length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text fw={500}>Arguments:</Text>
              <Code block>{JSON.stringify(job.args, null, 2)}</Code>
            </Stack>
          </>
        )}

        {job.kwargs && Object.keys(job.kwargs).length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text fw={500}>Keyword Arguments:</Text>
              <Code block>{JSON.stringify(job.kwargs, null, 2)}</Code>
            </Stack>
          </>
        )}

        {job.meta && Object.keys(job.meta).length > 0 && (
          <>
            <Divider />
            <Stack gap="xs">
              <Text fw={500}>Metadata:</Text>
              <Code block>{JSON.stringify(job.meta, null, 2)}</Code>
            </Stack>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
