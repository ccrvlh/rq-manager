import { useQueues } from "@/services/queues/queuesService";
import {
  ScheduledJob,
  ScheduledJobsQueryParams,
  useDeleteScheduledJob,
  useScheduledJobCounts,
  useScheduledJobs,
} from "@/services/scheduled/scheduledJobsService";
import { parseCronExpression } from "@/utils/cronParser";
import {
  ActionIcon,
  Badge,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconRefresh,
  IconRepeat,
  IconTrash,
} from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pagination } from "./Pagination";
import { ScheduledJobDrawer } from "./ScheduledJobDrawer";
import { SearchBar } from "./SearchBar";

export function Scheduled() {
  const [, setSearchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);

  const [queryParams, setQueryParams] = useState<ScheduledJobsQueryParams>({
    limit: 25,
    offset: 0,
    search: undefined,
    status: undefined,
    queue: undefined,
  });

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useScheduledJobs(queryParams);
  const { data: counts } = useScheduledJobCounts();
  const { data: queuesData } = useQueues({ limit: 100, offset: 0 });
  const deleteJob = useDeleteScheduledJob();

  const allJobs = jobsData?.data || [];
  const countsData = counts || { total: 0, pending: 0, overdue: 0 };

  // Client-side filtering
  const jobs = useMemo(() => {
    if (!queryParams.search) return allJobs;
    
    const searchTerm = queryParams.search.toLowerCase();
    return allJobs.filter(job => 
      job.func_name.toLowerCase().includes(searchTerm) ||
      job.id.toLowerCase().includes(searchTerm) ||
      job.queue.toLowerCase().includes(searchTerm) ||
      (job.description && job.description.toLowerCase().includes(searchTerm))
    );
  }, [allJobs, queryParams.search]);

  const handleQueryChange = useCallback(
    (updates: Partial<ScheduledJobsQueryParams>) => {
      setQueryParams((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      handleQueryChange({ search: value, offset: 0 });
    },
    [handleQueryChange]
  );

  const handleDelete = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    try {
      await deleteJob.mutateAsync(jobId);
      notifications.show({
        title: "Success",
        message: "Scheduled job deleted",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to delete scheduled job",
        color: "red",
      });
    }
  };

  const handleJobClick = (job: ScheduledJob) => {
    setSelectedJob(job);
    setSearchParams({ jobId: job.id });
    setDrawerOpened(true);
  };

  const closeDrawerAndClearParams = () => {
    setDrawerOpened(false);
    setSearchParams({});
  };

  // Calculate pagination
  const page =
    Math.floor((queryParams.offset || 0) / (queryParams.limit || 25)) + 1;
  const totalPages = jobsData
    ? Math.ceil(jobsData.total / (queryParams.limit || 25))
    : 0;

  if (jobsError) {
    return (
      <Container size="full" p="md">
        <Center py="xl">
          <Text c="red">Error loading scheduled jobs: {jobsError.message}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" fluid>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title order={1}>Scheduled Jobs</Title>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => window.location.reload()}
              title="Refresh"
              size="sm"
            >
              <IconRefresh size={16} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {jobsData?.total || 0} total jobs
            </Text>
          </Group>
          <Group gap="xs">
            <Badge color="blue" variant="light">
              Total: {countsData.total}
            </Badge>
            <Badge color="yellow" variant="light">
              Pending: {countsData.pending}
            </Badge>
            <Badge color="red" variant="light">
              Overdue: {countsData.overdue}
            </Badge>
          </Group>
        </Group>

        <SearchBar
          search={queryParams.search || ""}
          onSearchChange={handleSearchChange}
          status={queryParams.status || ""}
          onStatusChange={(value) =>
            handleQueryChange({ status: value, offset: 0 })
          }
          queue={queryParams.queue || ""}
          onQueueChange={(value) =>
            handleQueryChange({ queue: value, offset: 0 })
          }
          queues={queuesData?.data.map((q: any) => q.name) || []}
        />

        {jobsLoading && (
          <Center py="xl">
            <Loader />
          </Center>
        )}

        {!jobsLoading && jobsData && (
          <>
            {jobs.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">No scheduled jobs found</Text>
              </Center>
            ) : (
              <Stack gap="sm">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    withBorder
                    style={{ cursor: "pointer" }}
                    onClick={() => handleJobClick(job)}
                  >
                    <Group justify="space-between">
                      <Stack gap="xs">
                        <Group gap="xs">
                          <Text fw={500}>{job.func_name}</Text>
                          <Badge size="sm" variant="light">
                            {job.queue}
                          </Badge>
                        </Group>

                        {job.scheduled_for && (
                          <Group gap="xs">
                            <IconCalendar size={14} />
                            <Text size="sm" c="dimmed">
                              {new Date(job.scheduled_for).toLocaleString()}
                            </Text>
                          </Group>
                        )}

                        {job.meta?.["cron_string"] && (
                          <Group gap="xs">
                            <IconRepeat size={14} />
                            <Text size="sm" c="dimmed">
                              {job.meta["cron_string"]} -{" "}
                              {parseCronExpression(job.meta["cron_string"])}
                            </Text>
                          </Group>
                        )}

                        {job.description && (
                          <Text size="sm" c="dimmed">
                            {job.description}
                          </Text>
                        )}
                      </Stack>

                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={(e) => handleDelete(e, job.id)}
                        loading={deleteJob.isPending}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}

            {jobs.length > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={jobsData.total}
                limit={queryParams.limit || 25}
                onPageChange={(page) =>
                  handleQueryChange({
                    offset: (page - 1) * (queryParams.limit || 25),
                  })
                }
                onLimitChange={(limit) =>
                  handleQueryChange({ limit, offset: 0 })
                }
              />
            )}
          </>
        )}

        {!jobsLoading && selectedJob && (
          <ScheduledJobDrawer
            job={selectedJob}
            opened={drawerOpened}
            onClose={closeDrawerAndClearParams}
          />
        )}
      </Stack>
    </Container>
  );
}
