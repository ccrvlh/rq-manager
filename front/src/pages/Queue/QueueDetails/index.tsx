import { routes } from "@/routes";
import {
  useQueue,
  useQueueHealth,
  useQueueMetrics,
} from "@/services/queuesService";
import {
  ActionIcon,
  Alert,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { QueueChart } from "./QueueChart";
import { QueueHealthStatus } from "./QueueHealthStatus";
import { QueueMetricsGrid } from "./QueueMetricsGrid";
import { QueueOverview } from "./QueueOverview";

export function QueueDetails() {
  const { queueName } = useParams<{ queueName: string }>();
  const navigate = useNavigate();

  const {
    data: queue,
    isLoading: queueLoading,
    refetch: refetchQueue,
  } = useQueue(queueName!);
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQueueMetrics(queueName!);
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useQueueHealth(queueName!);

  const isLoading = queueLoading || metricsLoading || healthLoading;

  const handleRefresh = () => {
    refetchQueue();
    refetchMetrics();
    refetchHealth();
  };

  if (!queueName) {
    return (
      <Container size="xl" fluid>
        <Alert color="red">Queue name is required</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container size="xl" fluid>
        <Stack align="center" justify="center" h={400}>
          <Loader size="lg" />
        </Stack>
      </Container>
    );
  }

  if (!queue) {
    return (
      <Container size="xl" fluid>
        <Alert color="red">Queue not found</Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" fluid>
      <Stack gap="lg">
        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate(routes.queue)}>
              <IconArrowLeft size={16} />
            </ActionIcon>

            <Title order={1}>{queueName}</Title>
          </Group>
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Group>

        <QueueOverview queue={queue} />

        {health && <QueueHealthStatus health={health} />}

        {metrics && <QueueMetricsGrid metrics={metrics} />}

        {metrics && <QueueChart metrics={metrics} queueName={queueName} />}
      </Stack>
    </Container>
  );
}
