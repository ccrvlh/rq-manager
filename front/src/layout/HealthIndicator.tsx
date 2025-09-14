import { useRedisHealth } from "@/services/health/healthService";
import {
  ActionIcon,
  Badge,
  Group,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { IconDatabase, IconRefresh } from "@tabler/icons-react";

export function HealthIndicator() {
  const { data: redisHealth, isLoading, refetch } = useRedisHealth();
  const { colorScheme } = useMantineColorScheme();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "green";
      case "unhealthy":
        return "red";
      default:
        return "gray";
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Group gap="xs">
      <Tooltip
        label={
          redisHealth ? (
            <div>
              <Text size="sm" fw={500}>
                Redis Status
              </Text>
              <Text size="xs">Version: {redisHealth.version || "Unknown"}</Text>
              <Text size="xs">
                Uptime: {formatUptime(redisHealth.uptime_seconds)}
              </Text>
              {redisHealth.memory && (
                <>
                  <Text size="xs">Memory: {redisHealth.memory.used_human}</Text>
                  <Text size="xs">
                    Usage: {redisHealth.memory.usage_percent}%
                  </Text>
                </>
              )}
              {redisHealth.database && (
                <Text size="xs">Keys: {redisHealth.database.size}</Text>
              )}
              {redisHealth.error && (
                <Text size="xs" c="red">
                  Error: {redisHealth.error}
                </Text>
              )}
            </div>
          ) : (
            "Loading Redis status..."
          )
        }
        position="bottom"
      >
        <Badge
          color={getStatusColor(redisHealth?.status)}
          variant={colorScheme === "light" ? "filled" : "light"}
          leftSection={<IconDatabase size={12} />}
          style={{ cursor: "pointer" }}
        >
          <Group>
            <Text size="xs" fw="bold">
              Redis
            </Text>
            {redisHealth && redisHealth?.memory?.used_human && (
              <Text size="xs" fw="bold">
                {redisHealth.memory.used_human}
              </Text>
            )}
          </Group>
        </Badge>
      </Tooltip>

      <ActionIcon
        variant="subtle"
        size="md"
        onClick={() => refetch()}
        loading={isLoading}
        c={colorScheme === "light" ? "white" : undefined}
      >
        <IconRefresh size={16} />
      </ActionIcon>
    </Group>
  );
}
