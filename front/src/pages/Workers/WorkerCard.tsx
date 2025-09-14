import { MetricCardChart } from "@/components/MetricCardChart";
import { TimePeriod } from "@/pages/Home/TimePeriodSelector";
import { getWorkerDetailsRoute } from "@/routes";
import { useWorkerThroughput } from "@/services/analyticsService";
import { Worker } from "@/services/workersService";
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
  IconCircleFilled,
  IconClock,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconStack,
  IconTag,
  IconX,
  IconZzz,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface WorkerCardProps {
  worker: Worker;
}

export function WorkerCard({ worker }: WorkerCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const { colorScheme } = useMantineColorScheme();

  const now = dayjs();
  const [metricsTimePeriod] = useState<TimePeriod>({
    period: "5m",
    startDate: now.subtract(5, "minute").toDate(),
    endDate: now.toDate(),
  });

  const { data: rawThroughputData = [] } =
    useWorkerThroughput(metricsTimePeriod);
  const throughputData = rawThroughputData
    .filter(
      (d: any) => d.worker_name === worker.id || d.worker_name === worker.name
    )
    .map((d: any) => ({
      time: new Date(d.timestamp).getTime(),
      value: d.throughput,
    }));
  const latestThroughput = throughputData.length
    ? throughputData[throughputData.length - 1].value
    : 0;

  const getSuccessRate = () => {
    if (worker.total_jobs === 0) return 100;
    return Math.round((worker.successful_jobs / worker.total_jobs) * 100);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      {
        color: string;
        icon: React.ReactNode;
        label: string;
        gradient: string;
      }
    > = {
      busy: {
        color: "orange",
        icon: <IconActivity size={14} />,
        label: "Busy",
        gradient: "from-orange-600 to-amber-400",
      },
      idle: {
        color: "green",
        icon: <IconZzz size={14} />,
        label: "Idle",
        gradient: "from-green-600 to-emerald-400",
      },
      dead: {
        color: "red",
        icon: <IconAlertTriangle size={14} />,
        label: "Dead",
        gradient: "from-red-600 to-rose-400",
      },
      suspended: {
        color: "yellow",
        icon: <IconPlayerPause size={14} />,
        label: "Suspended",
        gradient: "from-yellow-600 to-amber-400",
      },
      started: {
        color: "blue",
        icon: <IconCircleFilled size={14} />,
        label: "Starting",
        gradient: "from-blue-600 to-indigo-400",
      },
      busy_long: {
        color: "red",
        icon: <IconActivity size={14} />,
        label: "Busy Long",
        gradient: "from-red-600 to-rose-400",
      },
    };
    return configs[status] || configs.idle;
  };

  const getHealthStatus = () => {
    if (worker.status === "dead") return { status: "critical", color: "red" };
    if (worker.status === "busy_long")
      return { status: "warning", color: "orange" };
    if (worker.status === "busy" || worker.status === "idle")
      return { status: "healthy", color: "green" };
    return { status: "unknown", color: "gray" };
  };

  const health = getHealthStatus();
  //@ts-ignore
  const successRate = getSuccessRate();

  const handleWorkerAction = (action: string) => {
    notifications.show({
      title: action.charAt(0).toUpperCase() + action.slice(1),
      message: `${action} worker ${worker.name}`,
      color: "blue",
    });
  };

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

  //@ts-ignore
  const _getUptime = () => {
    if (!worker.birth_date) return "Unknown";
    return formatRelativeTime(worker.birth_date);
  };

  const jobsDistribution = [
    {
      label: "Successful",
      value: worker.successful_jobs,
      color: "green",
      icon: <IconCheck size={12} />,
    },
    {
      label: "Failed",
      value: worker.failed_jobs,
      color: "red",
      icon: <IconX size={12} />,
    },
    {
      label: "Current",
      value: worker.current_job_func ? 1 : 0,
      color: "orange",
      icon: <IconActivity size={12} />,
    },
  ].filter(
    (item) =>
      item.value > 0 || item.label === "Successful" || item.label === "Failed"
  );

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
      onClick={() => navigate(getWorkerDetailsRoute(worker.name))}
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
              getStatusConfig(worker.status).color
            }-6), var(--mantine-color-${
              getStatusConfig(worker.status).color
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
                {worker.name}
              </Text>
            </Flex>

            <Flex align="center" gap={8}>
              <Badge
                variant="gradient"
                gradient={{
                  from: getStatusConfig(worker.status).color,
                  to: getStatusConfig(worker.status).color,
                }}
                size="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {getStatusConfig(worker.status).icon}
                {getStatusConfig(worker.status).label}
              </Badge>

              {worker.is_scheduler && (
                <Badge
                  variant="light"
                  color="purple"
                  size="sm"
                  fw={600}
                  leftSection={<IconClock size={10} />}
                >
                  Scheduler
                </Badge>
              )}
            </Flex>
          </Stack>

          {/* Queue Count in Header - Compact but visible */}
          <Flex align="center" gap={4}>
            <IconStack size={14} color="teal" />
            <Text size="md" c="teal" fw={600}>
              {worker.queues?.length || 0}
            </Text>
          </Flex>
        </Group>
        {/* Key Metrics Section - Focused on Worker Activity */}
        <MetricCardChart
          value={latestThroughput}
          unit="/s"
          label=""
          data={throughputData}
          icon={<IconActivity size={14} />}
          trend={worker.total_jobs > 10 ? "up" : "stable"}
          // color="purple"
          tooltipLabel="jobs per 30s interval"
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

          {jobsDistribution.slice(0, 4).map((job) => (
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
                value={
                  worker.total_jobs > 0
                    ? (job.value / worker.total_jobs) * 100
                    : 0
                }
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
        {/* Current Job Section */}
        {worker.current_job_func && (
          <Box
            p="sm"
            bg={
              colorScheme === "dark"
                ? "var(--mantine-color-blue-9)"
                : "var(--mantine-color-blue-0)"
            }
            style={{
              borderRadius: "var(--mantine-radius-md)",
              borderLeft: `3px solid var(--mantine-color-blue-6)`,
            }}
          >
            <Text size="xs" c="dimmed" fw={500} mb={4}>
              CURRENT JOB
            </Text>
            <Text size="sm" fw={600} truncate>
              {worker.current_job_func}
            </Text>
            {worker.current_queue && (
              <Badge size="xs" variant="outline" color="blue" mt={4}>
                {worker.current_queue}
              </Badge>
            )}
          </Box>
        )}
        {/* Queues Section */}
        {worker.queues && worker.queues.length > 0 && (
          <Flex gap={6} wrap="wrap" align="center">
            <IconTag
              size={12}
              color={colorScheme === "dark" ? "gray.5" : "gray.6"}
            />
            {worker.queues.slice(0, 3).map((queue) => (
              <Badge
                key={queue}
                size="xs"
                variant="outline"
                color="blue"
                style={{ transition: "all 0.2s ease" }}
              >
                {queue}
              </Badge>
            ))}
            {worker.queues.length > 3 && (
              <Badge size="xs" variant="dot" color="blue">
                +{worker.queues.length - 3}
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
              {formatRelativeTime(worker.last_heartbeat)}
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
              {worker.status === "busy" && (
                <Tooltip label="Suspend worker" position="top" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="orange"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkerAction("suspend");
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

              {worker.status === "suspended" && (
                <Tooltip label="Resume worker" position="top" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="green"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkerAction("resume");
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

              <Tooltip label="Refresh worker" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWorkerAction("refresh");
                  }}
                  style={{
                    transition: "all 0.2s ease",
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Delete worker" position="top" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWorkerAction("delete");
                  }}
                  style={{
                    transition: "all 0.2s ease",
                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <IconX size={14} />
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
