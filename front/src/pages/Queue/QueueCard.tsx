import { MetricCardChart } from "@/components/MetricCardChart";
import { QueueDetails, QueuePriority, QueueStatus } from "@/pages/Queue/types";
import { getQueueDetailsRoute } from "@/routes";
import { useQueueDepth } from "@/services/analytics/analyticsService";
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Divider,
  Flex,
  Group,
  Indicator,
  Progress,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconActivity,
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconTag,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface QueueCardProps {
  queue: QueueDetails;
}

export function QueueCard({ queue }: QueueCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  const defaultPeriod = useMemo(() => {
    const now = dayjs();
    return {
      period: "5m",
      startDate: now.subtract(5, "minute").toDate(),
      endDate: now.toDate(),
    };
  }, []);

  const { data: rawData = [] } = useQueueDepth(defaultPeriod);
  const timeSeriesData = rawData.filter((d) => d.queue_name === queue.name);

  const totalJobs =
    queue.queued_jobs +
    queue.started_jobs +
    queue.finished_jobs +
    queue.failed_jobs +
    queue.deferred_jobs +
    queue.scheduled_jobs;

  const getStatusConfig = (status: QueueStatus) => {
    const configs = {
      [QueueStatus.ACTIVE]: {
        color: "green",
        icon: <IconActivity size={14} />,
        label: "Active",
        gradient: "from-green-600 to-emerald-400",
      },
      [QueueStatus.PAUSED]: {
        color: "yellow",
        icon: <IconClock size={14} />,
        label: "Paused",
        gradient: "from-yellow-600 to-amber-400",
      },
      [QueueStatus.FAILED]: {
        color: "red",
        icon: <IconAlertTriangle size={14} />,
        label: "Failed",
        gradient: "from-red-600 to-rose-400",
      },
      [QueueStatus.SCHEDULED]: {
        color: "blue",
        icon: <IconClock size={14} />,
        label: "Scheduled",
        gradient: "from-blue-600 to-indigo-400",
      },
    };
    return configs[status];
  };

  const getPriorityConfig = (priority: QueuePriority) => {
    const configs = {
      [QueuePriority.LOW]: {
        color: "gray",
        label: "Low",
        bg: "bg-gray-100",
      },
      [QueuePriority.NORMAL]: {
        color: "blue",
        label: "Normal",
        bg: "bg-blue-100",
      },
      [QueuePriority.HIGH]: {
        color: "orange",
        label: "High",
        bg: "bg-orange-100",
      },
      [QueuePriority.CRITICAL]: {
        color: "red",
        label: "Critical",
        bg: "bg-red-100",
      },
    };
    return configs[priority];
  };

  const handleQueueAction = (action: string) => {
    notifications.show({
      title: action.charAt(0).toUpperCase() + action.slice(1),
      message: `${action} queue ${queue.name}`,
      color: "blue",
    });
  };

  const jobDistribution = [
    {
      label: "Queued",
      value: queue.queued_jobs,
      color: "blue",
      icon: <IconClock size={12} />,
    },
    {
      label: "Active",
      value: queue.started_jobs,
      color: "orange",
      icon: <IconActivity size={12} />,
    },
    {
      label: "Completed",
      value: queue.finished_jobs,
      color: "green",
      icon: <IconCheck size={12} />,
    },
    {
      label: "Failed",
      value: queue.failed_jobs,
      color: "red",
      icon: <IconAlertTriangle size={12} />,
    },
    {
      label: "Deferred",
      value: queue.deferred_jobs,
      color: "yellow",
      icon: <IconClock size={12} />,
    },
    {
      label: "Scheduled",
      value: queue.scheduled_jobs,
      color: "purple",
      icon: <IconCalendar size={12} />,
    },
  ];

  const getHealthStatus = () => {
    if (queue.status === QueueStatus.FAILED)
      return { status: "poor", color: "red" };
    if (queue.failed_jobs > queue.finished_jobs * 0.1)
      return { status: "warning", color: "orange" };
    if (queue.status === QueueStatus.ACTIVE && queue.worker_count > 0)
      return { status: "healthy", color: "green" };
    return { status: "unknown", color: "gray" };
  };

  const health = getHealthStatus();

  // Transform time series data for the chart
  const chartData = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return [];
    }

    // Convert to format expected by MetricCardChart: { time: number; value: number }[]
    const sliced = timeSeriesData.slice(-20); // keep last 20 points for small card
    return sliced.map((item) => ({
      time: item.timestamp, // use actual timestamp for axis
      value: item.queued_jobs, // show queue depth only
    }));
  }, [timeSeriesData]);

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return "No activity";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card
      shadow="lg"
      p="lg"
      radius="xl"
      withBorder
      style={{
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => navigate(getQueueDetailsRoute(queue.name))}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      styles={{
        root: {
          "&:hover": {
            transform: "translateY(-4px) scale(1.02)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(to right, var(--mantine-color-${
              getStatusConfig(queue.status).color
            }-6), var(--mantine-color-${
              getStatusConfig(queue.status).color
            }-4))`,
            transition: "all 0.3s ease",
          },
          "&:hover::before": {
            height: "4px",
          },
        },
      }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        {/* Header Section */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={2} style={{ flex: 1 }}>
            <Flex align="center" gap={12}>
              {/* Status Indicator Dot */}
              <Indicator
                processing
                inline
                color="red"
                size={12}
                bg={health.status === "healthy" ? "green" : health.color}
              />
              <Text
                fw={700}
                size="xl"
                c={colorScheme === "dark" ? "gray.0" : "gray.9"}
                truncate
                style={{
                  transition: "all 0.2s ease",
                }}
              >
                {queue.name}
              </Text>
            </Flex>

            <Flex align="center" gap={8}>
              <Badge
                variant="gradient"
                gradient={{
                  from: getStatusConfig(queue.status).color,
                  to: getStatusConfig(queue.status).color,
                }}
                size="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {getStatusConfig(queue.status).icon}
                {getStatusConfig(queue.status).label}
              </Badge>

              <Badge
                variant="light"
                color={getPriorityConfig(queue.priority).color}
                size="sm"
                fw={600}
              >
                {getPriorityConfig(queue.priority).label}
              </Badge>
            </Flex>
          </Stack>

          {/* Worker Count in Header - Compact but visible */}
          <Flex align="center" gap={4}>
            <IconUsers size={14} color="teal" />
            <Text size="md" c="teal" fw={600}>
              {queue.worker_count}
            </Text>
          </Flex>
        </Group>

        {/* Key Metrics Section - Focused on RQ Management */}
        {/* Main metric: Queue Jobs with evolution */}
        <MetricCardChart
          value={queue.queued_jobs + queue.started_jobs}
          label=""
          data={chartData}
          icon={<IconActivity size={14} />}
          trend={queue.queued_jobs > 5 ? "up" : "stable"}
          color="blue"
          tooltipLabel="queued + started jobs"
        />

        {/* Job Distribution Progress Bars */}
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={600} c="dimmed">
              Job Distribution
            </Text>
            <Text size="xs" c="dimmed">
              Key Metrics
            </Text>
          </Group>

          {jobDistribution.slice(0, 4).map((job) => (
            <Stack key={job.label} gap={2}>
              <Group justify="space-between" align="center">
                <Flex align="center" gap={6}>
                  {job.icon}
                  <Text
                    size="xs"
                    fw={500}
                    c={colorScheme === "dark" ? "gray.5" : "dark.7"}
                  >
                    {job.label}
                  </Text>
                </Flex>
                <Text size="xs" fw={600} c={job.color + ".7"}>
                  {job.value.toLocaleString()}
                </Text>
              </Group>
              <Progress
                value={(job.value / totalJobs) * 100}
                color={job.color}
                size="xs"
                radius="xl"
                animated={job.value > 0 && isHovered}
                styles={{
                  root: {
                    backgroundColor:
                      colorScheme === "dark"
                        ? "var(--mantine-color-dark-4)"
                        : "var(--mantine-color-gray-1)",
                  },
                }}
              />
            </Stack>
          ))}
        </Stack>
        <Divider my="xs" />

        {/* Description Section */}
        {queue.description && (
          <Tooltip
            label={queue.description}
            position="top"
            multiline
            withinPortal
          >
            <Text
              size="sm"
              c="dimmed"
              lineClamp={2}
              style={{
                transition: "all 0.2s ease",
                lineHeight: 1.4,
              }}
            >
              {queue.description}
            </Text>
          </Tooltip>
        )}

        {/* Tags Section */}
        {queue.tags && queue.tags.length > 0 && (
          <Flex gap={6} wrap="wrap" align="center">
            <IconTag
              size={12}
              color={colorScheme === "dark" ? "gray.5" : "gray.6"}
            />
            {queue.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                size="xs"
                variant="outline"
                color="gray"
                style={{ transition: "all 0.2s ease" }}
              >
                {tag}
              </Badge>
            ))}
            {queue.tags.length > 3 && (
              <Badge size="xs" variant="dot" color="gray">
                +{queue.tags.length - 3}
              </Badge>
            )}
          </Flex>
        )}

        {/* Footer Section */}
        <Group justify="space-between" align="center" mt="auto" pt="sm">
          <Flex align="center" gap={4} opacity={0.7}>
            <IconCalendar
              size={12}
              color={colorScheme === "dark" ? "gray.5" : "gray.6"}
            />
            <Text size="xs" c="dimmed" fw={500}>
              {formatRelativeTime(queue.last_activity)}
            </Text>
          </Flex>

          <Flex align="center" gap={8}>
            <Box
              w="4px"
              h="4px"
              bg={health.color}
              style={{
                borderRadius: "50%",
                opacity: isHovered ? 1 : 0.6,
                transition: "all 0.2s ease",
              }}
            />

            <Group
              gap={4}
              style={{
                opacity: isHovered ? 1 : 0.7,
                transition: "opacity 0.2s ease",
              }}
            >
              {queue.status === QueueStatus.ACTIVE && (
                <Tooltip label="Pause queue" position="top" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="yellow"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQueueAction("pause");
                    }}
                    style={{
                      transition: "all 0.2s ease",
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    <IconPlayerPause size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

              {queue.status === QueueStatus.PAUSED && (
                <Tooltip label="Resume queue" position="top" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="green"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQueueAction("resume");
                    }}
                    style={{
                      transition: "all 0.2s ease",
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    <IconPlayerPlay size={14} />
                  </ActionIcon>
                </Tooltip>
              )}

              <Tooltip label="Empty queue" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueueAction("empty");
                  }}
                  style={{
                    transition: "all 0.2s ease",
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete queue" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQueueAction("delete");
                  }}
                  style={{
                    transition: "all 0.2s ease",
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Flex>
        </Group>
      </Stack>

      <style>
        {colorScheme === "dark"
          ? `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 var(--mantine-color-${health.color}-5);
            }
            70% {
              box-shadow: 0 0 0 4px rgba(0, 0, 0, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            }
          }
        `
          : `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 var(--mantine-color-${health.color}-6);
            }
            70% {
              box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
            }
          }
        `}
      </style>
    </Card>
  );
}
