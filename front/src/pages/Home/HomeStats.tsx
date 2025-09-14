import { useDashboardStats } from "@/services/dashboardService";
import { Avatar, Box, Card, Grid, Group, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconListCheck,
  IconUsers,
} from "@tabler/icons-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function HomeStats() {
  const { data: stats } = useDashboardStats();

  return (
    <Grid gutter="md">
      <Grid.Col span={3}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group>
            <Avatar color="green" variant="light">
              <IconUsers size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">
                Active Workers
              </Text>
              <Text size="xl" fw={700}>
                {stats?.activeWorkers || 0}
              </Text>
              <Text size="xs" c="dimmed">
                Processing capacity: {stats?.processingCapacity || 0}%
              </Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>

      <Grid.Col span={3}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group>
            <Avatar color="blue" variant="light">
              <IconListCheck size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">
                Total Jobs
              </Text>
              <Text size="xl" fw={700}>
                {stats?.totalJobs || 0}
              </Text>
              <Text size="xs" c="dimmed">
                Across all queues
              </Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>

      <Grid.Col span={3}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group>
            <Avatar color="red" variant="light">
              <IconAlertTriangle size={20} />
            </Avatar>
            <Box>
              <Text size="sm" c="dimmed">
                Failed Jobs
              </Text>
              <Text size="xl" fw={700}>
                {stats?.failedJobs || 0}
              </Text>
              <Text size="xs" c="red">
                {(
                  ((stats?.failedJobs || 0) / (stats?.totalJobs || 1)) *
                  100
                ).toFixed(1)}
                % failure rate
              </Text>
            </Box>
          </Group>
        </Card>
      </Grid.Col>

      <Grid.Col span={3}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group>
            <Avatar color="teal" variant="light">
              <IconCheck size={20} />
            </Avatar>
            <div>
              <Text size="sm" c="dimmed">
                Success Rate
              </Text>
              <Text size="xl" fw={700}>
                {stats?.successRate || 0}%
              </Text>
              <Text size="xs" c="dimmed">
                Last 24 hours
              </Text>
            </div>
          </Group>
        </Card>
      </Grid.Col>
    </Grid>
  );
}
