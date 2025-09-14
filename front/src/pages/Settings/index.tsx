import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDeviceFloppy, IconMoonStars, IconSun } from "@tabler/icons-react";
import { useSettings } from "@/contexts/SettingsContext";

export function Settings() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleSave = () => {
    notifications.show({
      title: "Settings saved",
      message: "Your preferences have been saved successfully",
      color: "green",
    });
  };

  const handleReset = () => {
    resetSettings();
    notifications.show({
      title: "Settings reset",
      message: "Settings have been reset to defaults",
      color: "blue",
    });
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Box>
            <Title order={2}>Settings</Title>
          </Box>
          <Box>
            <Button
              variant="light"
              onClick={handleReset}
              mr="xs"
            >
              Reset to Defaults
            </Button>
            <Button
              ml="xs"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Box>
        </Group>

        {/* Appearance Settings */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} size="lg">
                Appearance
              </Text>
              <ActionIcon
                variant="light"
                onClick={toggleColorScheme}
                title="Toggle theme"
              >
                {colorScheme === "dark" ? (
                  <IconSun size={16} />
                ) : (
                  <IconMoonStars size={16} />
                )}
              </ActionIcon>
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  Auto Refresh
                </Text>
                <Text size="xs" c="dimmed">
                  Automatically refresh data
                </Text>
              </div>
              <Switch
                checked={settings.autoRefresh}
                onChange={(e) =>
                  updateSettings({ autoRefresh: e.currentTarget.checked })
                }
              />
            </Group>

            {settings.autoRefresh && (
              <>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      Dashboard Refresh (seconds)
                    </Text>
                    <Text size="xs" c="dimmed">
                      Dashboard and stats updates
                    </Text>
                  </div>
                  <NumberInput
                    value={settings.dashboardRefreshInterval / 1000}
                    onChange={(val) =>
                      updateSettings({ dashboardRefreshInterval: (Number(val) || 30) * 1000 })
                    }
                    min={5}
                    max={300}
                    w={100}
                  />
                </Group>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      Jobs Refresh (seconds)
                    </Text>
                    <Text size="xs" c="dimmed">
                      Jobs list updates
                    </Text>
                  </div>
                  <NumberInput
                    value={settings.jobsRefreshInterval / 1000}
                    onChange={(val) =>
                      updateSettings({ jobsRefreshInterval: (Number(val) || 10) * 1000 })
                    }
                    min={5}
                    max={300}
                    w={100}
                  />
                </Group>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>
                      Analytics Refresh (seconds)
                    </Text>
                    <Text size="xs" c="dimmed">
                      Charts and analytics updates
                    </Text>
                  </div>
                  <NumberInput
                    value={settings.analyticsRefreshInterval / 1000}
                    onChange={(val) =>
                      updateSettings({ analyticsRefreshInterval: (Number(val) || 30) * 1000 })
                    }
                    min={10}
                    max={300}
                    w={100}
                  />
                </Group>
              </>
            )}
          </Stack>
        </Card>



        {/* Data & Storage Settings */}
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600} size="lg">
              Data & Storage
            </Text>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  Data Retention
                </Text>
                <Text size="xs" c="dimmed">
                  Days to keep job history
                </Text>
              </div>
              <NumberInput
                value={settings.dataRetentionDays}
                onChange={(val) =>
                  updateSettings({ dataRetentionDays: Number(val) || 30 })
                }
                min={1}
                max={365}
                w={100}
              />
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>
                  Jobs Per Page
                </Text>
                <Text size="xs" c="dimmed">
                  Maximum jobs displayed per page
                </Text>
              </div>
              <Select
                value={settings.maxJobsPerPage.toString()}
                onChange={(val) =>
                  updateSettings({ maxJobsPerPage: Number(val) || 50 })
                }
                data={["25", "50", "100", "200"]}
                w={100}
              />
            </Group>
          </Stack>
        </Card>


      </Stack>
    </Container>
  );
}
