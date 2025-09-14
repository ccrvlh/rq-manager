import { useDashboardQueues } from "@/services/dashboard/dashboardService";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconStack } from "@tabler/icons-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

export function HomeQueueDetails() {
  const navigate = useNavigate();
  const { data: queues } = useDashboardQueues();

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="transparent" size="lg">
            <IconStack size={16} />
          </ActionIcon>
          <Title order={4}>Queue Details</Title>
        </Group>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => navigate("/queues")}
        >
          Manage Queues
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Queue</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Pending</Table.Th>
            <Table.Th>Processing</Table.Th>
            <Table.Th>Failed</Table.Th>
            <Table.Th>Completed</Table.Th>
            <Table.Th>Success Rate</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {queues?.map((queue) => (
            <Table.Tr key={queue.name}>
              <Table.Td>
                <Text fw={500}>{queue.name}</Text>
              </Table.Td>
              <Table.Td>
                {queue.queued_jobs +
                  queue.started_jobs +
                  queue.finished_jobs +
                  queue.failed_jobs}
              </Table.Td>
              <Table.Td>
                <Text c="orange">{queue.queued_jobs}</Text>
              </Table.Td>
              <Table.Td>
                <Text c="blue">{queue.started_jobs}</Text>
              </Table.Td>
              <Table.Td>
                <Text c="red">{queue.failed_jobs}</Text>
              </Table.Td>
              <Table.Td>
                <Text c="green">{queue.finished_jobs}</Text>
              </Table.Td>
              <Table.Td>
                {queue.queued_jobs +
                  queue.started_jobs +
                  queue.finished_jobs +
                  queue.failed_jobs >
                  0 && (
                  <Text
                    fw={500}
                    c={queue.failed_jobs === 0 ? "green" : "orange"}
                  >
                    {(
                      (queue.finished_jobs /
                        (queue.queued_jobs +
                          queue.started_jobs +
                          queue.finished_jobs +
                          queue.failed_jobs)) *
                      100
                    ).toFixed(1)}
                    %
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
