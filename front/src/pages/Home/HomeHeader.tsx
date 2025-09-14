import { useSettings } from "@/contexts/SettingsContext";
import { Button, Group, Select, Text, Title } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function HomeHeader() {
  const { settings, updateSettings } = useSettings();
  return (
    <Group justify="space-between">
      <Group>
        <Title order={1}>Dashboard</Title>
        <Text size="sm" c="dimmed">
          Real-time overview of your RQ queues, workers, and jobs
        </Text>
      </Group>
      <Group>
        <Button
          variant="subtle"
          onClick={() => window.location.reload()}
          leftSection={<IconRefresh size={16} />}
        />
        <Select
          w="150px"
          variant="transparent"
          value={(settings.dashboardRefreshInterval / 1000).toString()}
          onChange={(value) =>
            updateSettings({
              dashboardRefreshInterval: (Number(value) || 30) * 1000,
            })
          }
          data={[
            { value: "1", label: "1s refresh" },
            { value: "5", label: "5s refresh" },
            { value: "10", label: "10s refresh" },
            { value: "30", label: "30s refresh" },
            { value: "60", label: "60s refresh" },
          ]}
        />
      </Group>
    </Group>
  );
}
