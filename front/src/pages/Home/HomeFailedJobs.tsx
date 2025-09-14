import { useFailedJobs } from "@/services/dashboard/dashboardService";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconTool } from "@tabler/icons-react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

export function HomeFailedJobs() {
  const navigate = useNavigate();

  const { data: failedJobs } = useFailedJobs();

  const handleViewJobDetails = (jobId: string) => {
    navigate(`/jobs?jobId=${jobId}`);
  };

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="transparent" size="lg">
            <IconTool size={16} />
          </ActionIcon>
          <Title order={4}>Failed Jobs</Title>
        </Group>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => navigate("/jobs?status=failed")}
        >
          {failedJobs?.length || 0} total
        </Button>
      </Group>

      <ScrollArea h={300}>
        <Stack gap="xs">
          {failedJobs?.map((job) => (
            <Paper
              key={job.id}
              p="md"
              withBorder
              radius="md"
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => handleViewJobDetails(job.id)}
            >
              <Stack gap="sm">
                <Text size="sm" fw={600} lineClamp={2}>
                  {job.func_name}
                </Text>
                <Group justify="space-between" align="center">
                  <Badge size="sm" color="red" variant="filled">
                    Failed
                  </Badge>
                  <Text size="xs" c="dimmed" fw={500}>
                    {dayjs(job.ended_at || job.created_at).fromNow()}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
