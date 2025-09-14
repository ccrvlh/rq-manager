import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useCancelJob, useJobs, useRetryJob } from "@/services/jobsService";
import { useQueues } from "@/services/queuesService";
import {
  ActionIcon,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Queue } from "../Queue/types";
import { CreateJobModal } from "./CreateJobModal";
import { JobDetailsDrawer } from "./JobDetailsDrawer";
import { JobsTable } from "./JobsTable";
import { getJobKey } from "./jobUtils";
import { Pagination } from "./Pagination";
import { SearchBar } from "./SearchBar";
import { Job, JobStatus, JobsQueryParams } from "./types";

export function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  const [queryParams, setQueryParams] = useState<JobsQueryParams>({
    limit: 50,
    offset: 0,
    queue: [],
    status: undefined,
    search: undefined,
  });

  const {
    data: jobsData,
    isLoading,
    error: jobsError,
    refetch,
  } = useJobs(queryParams);
  const { jobs: jobsRefreshInterval } = useRefreshInterval();
  const { data: queuesData } = useQueues({ limit: 100, offset: 0 });
  const { mutateAsync: retryJob } = useRetryJob();
  const { mutateAsync: cancelJob } = useCancelJob();

  const handleQueryChange = useCallback((updates: Partial<JobsQueryParams>) => {
    setQueryParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      handleQueryChange({ search: value });
    },
    [handleQueryChange]
  );

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setSearchParams({ jobId: job.id });
    openDrawer();
  };

  const closeDrawerAndClearParams = () => {
    closeDrawer();
    setSearchParams({});
  };

  // Auto-open drawer if jobId in URL
  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId && jobsData?.data) {
      const job = jobsData.data.find((j) => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        openDrawer();
      }
    }
  }, [jobsData?.data, searchParams, openDrawer]);

  const handleRetryJob = async (jobId: string) => {
    try {
      await retryJob(jobId);
      notifications.show({
        title: "Success",
        message: "Job retry initiated",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to retry job",
        color: "red",
      });
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
      notifications.show({
        title: "Success",
        message: "Job cancelled",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to cancel job",
        color: "red",
      });
    }
  };

  const handleJobSelect = (jobKey: string, selected: boolean) => {
    setSelectedJobs((prev) =>
      selected ? [...prev, jobKey] : prev.filter((key) => key !== jobKey)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedJobs(
      selected ? jobsData?.data.map((job) => getJobKey(job)) || [] : []
    );
  };

  // Calculate pagination
  const page = Math.floor(queryParams.offset / queryParams.limit) + 1;
  const totalPages = jobsData
    ? Math.ceil(jobsData.total / queryParams.limit)
    : 0;

  // Auto-refresh jobs at interval
  useEffect(() => {
    if (typeof jobsRefreshInterval !== "number") return;
    const id = setInterval(() => {
      refetch();
    }, jobsRefreshInterval);
    return () => clearInterval(id);
  }, [jobsRefreshInterval, refetch]);

  if (jobsError) {
    return (
      <Container size="full" p="md">
        <Center py="xl">
          <Text c="red">Error loading jobs: {jobsError.message}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" fluid>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title order={1}>Jobs</Title>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => refetch()}
              title="Refresh"
              size="sm"
            >
              <IconRefresh size={16} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {jobsData?.total || 0} total jobs
            </Text>
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            Create Job
          </Button>
        </Group>

        <SearchBar
          search={queryParams.search || ""}
          onSearchChange={handleSearchChange}
          status={queryParams.status || ""}
          onStatusChange={(value) =>
            handleQueryChange({ status: value as JobStatus | undefined })
          }
          queue={queryParams.queue || []}
          onQueueChange={(value) => handleQueryChange({ queue: value })}
          queues={queuesData?.data.map((q: Queue) => q.name) || []}
        />

        <Paper shadow="sm" p="md" withBorder>
          {isLoading && (
            <Center py="xl">
              <Loader />
            </Center>
          )}

          {!isLoading && jobsData && (
            <>
              <JobsTable
                jobs={jobsData.data}
                onJobClick={handleJobClick}
                selectedJobKey={
                  selectedJob ? getJobKey(selectedJob) : undefined
                }
                selectedJobs={selectedJobs}
                onJobSelect={handleJobSelect}
                onSelectAll={handleSelectAll}
              />

              {jobsData.data?.length > 0 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={jobsData.total}
                  limit={queryParams.limit}
                  onPageChange={(page) =>
                    handleQueryChange({
                      offset: (page - 1) * queryParams.limit,
                    })
                  }
                  onLimitChange={(limit) =>
                    handleQueryChange({ limit, offset: 0 })
                  }
                />
              )}

              {jobsData.data?.length === 0 && (
                <Center py="xl">
                  <Text c="dimmed">No jobs found</Text>
                </Center>
              )}
            </>
          )}
        </Paper>

        {!isLoading && selectedJob && (
          <JobDetailsDrawer
            job={selectedJob}
            opened={drawerOpened}
            onClose={closeDrawerAndClearParams}
            onRetry={handleRetryJob}
            onRemove={handleCancelJob}
          />
        )}

        <CreateJobModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
          }}
        />
      </Stack>
    </Container>
  );
}
