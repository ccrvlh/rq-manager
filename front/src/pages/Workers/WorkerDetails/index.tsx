import { routes } from "@/routes";
import { useWorker, useWorkerJobs } from "@/services/workersService";
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
import { WorkerJobs } from "./WorkerJobs";
import { WorkerOverview } from "./WorkerOverview";

export function WorkerDetails() {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();

  const {
    data: worker,
    isLoading: workerLoading,
    refetch: refetchWorker,
  } = useWorker(workerId!);
  const {
    data: jobs,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useWorkerJobs(workerId!);

  const isLoading = workerLoading || jobsLoading;

  const handleRefresh = () => {
    refetchWorker();
    refetchJobs();
  };

  if (!workerId) {
    return (
      <Container size="xl" fluid>
        <Alert color="red">Worker ID is required</Alert>
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

  if (!worker) {
    return (
      <Container size="xl" fluid>
        <Alert color="red">Worker not found</Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" fluid>
      <Stack gap="lg">
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => navigate(routes.workers)}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
            <Title order={1}>{worker.name}</Title>
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

        <WorkerOverview worker={worker} />
        <WorkerJobs jobs={jobs || []} />
      </Stack>
    </Container>
  );
}
