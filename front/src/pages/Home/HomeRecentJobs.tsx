import { useRecentJobs } from "@/services/dashboardService";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconRefresh, IconTool } from "@tabler/icons-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

export function HomeRecentJobs() {
  const navigate = useNavigate();

  const { data: recentJobs } = useRecentJobs();

  const handleRetryJob = async (jobId: string) => {
    notifications.show({
      title: "Job Retried",
      message: `Job ${jobId} has been retried successfully`,
      color: "green",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished":
        return "green";
      case "started":
        return "blue";
      case "failed":
        return "red";
      case "queued":
        return "orange";
      case "scheduled":
        return "yellow";
      case "active":
      case "busy":
        return "green";
      case "idle":
        return "yellow";
      case "dead":
        return "red";
      case "suspended":
        return "orange";
      default:
        return "gray";
    }
  };

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="transparent" size="lg">
            <IconTool size={16} />
          </ActionIcon>
          <Title order={4}>Recent Jobs</Title>
        </Group>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => navigate("/jobs")}
        >
          Manage Jobs
        </Button>
      </Group>

      <ScrollArea h={300}>
        <Stack gap="xs">
          {recentJobs?.map((job) => (
            <Card key={job.id} padding="sm" withBorder>
              <Group justify="space-between" align="center">
                <Box>
                  <Text size="sm" fw={500}>
                    {job.func_name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(job.created_at).fromNow()}
                  </Text>
                </Box>
                <Group>
                  {job.status === "failed" && (
                    <ActionIcon
                      size="sm"
                      color="blue"
                      variant="light"
                      onClick={() => handleRetryJob(job.id)}
                    >
                      <IconRefresh size={12} />
                    </ActionIcon>
                  )}
                  <Badge color={getStatusColor(job.status || "unknown")}>
                    {job.status || "unknown"}
                  </Badge>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
