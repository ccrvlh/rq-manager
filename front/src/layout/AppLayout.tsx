import { AppShell, Button, Flex, useMantineColorScheme } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import { AppRoutes } from "../routes/AppRoutes";
import { AppContent } from "./AppContent";
import { AppThemeToggle } from "./AppThemeToggle";
import { HealthIndicator } from "./HealthIndicator";

export function AppLayout() {
  const location = useLocation();
  const { colorScheme } = useMantineColorScheme();

  const menuItems = [
    { label: "Dashboard", to: "/" },
    { label: "Jobs", to: "/jobs" },
    { label: "Queue", to: "/queues" },
    { label: "Workers", to: "/workers" },
    { label: "Scheduled", to: "/scheduled" },
    { label: "Settings", to: "/settings" },
  ];

  return (
    <AppShell padding="md" header={{ height: 60 }}>
      <AppShell.Header
        py="sm"
        bg={colorScheme === "light" ? "primary.5" : undefined}
      >
        <Flex direction="row" mx="50px" justify={{ sm: "center" }}>
          <img
            alt="logo"
            src="/logo.png"
            width={40}
            height={40}
            style={{ marginRight: "10px" }}
          />
          {menuItems.map((item) => (
            <Button
              key={item.to}
              component={Link}
              to={item.to}
              variant={location.pathname === item.to ? "filled" : "subtle"}
              color={
                location.pathname === item.to
                  ? colorScheme === "dark"
                    ? "gray.8"
                    : "white"
                  : colorScheme === "light"
                  ? "primary.9"
                  : "gray.5"
              }
              c={
                location.pathname !== item.to
                  ? colorScheme === "dark"
                    ? "gray.5"
                    : "white"
                  : colorScheme === "light"
                  ? "primary.9"
                  : undefined
              }
              fw="bold"
              mx="xs"
            >
              {item.label}
            </Button>
          ))}
          <Flex style={{ flexGrow: 1 }} />
          <Flex align="center" gap="xs">
            <HealthIndicator />
            <AppThemeToggle />
          </Flex>
        </Flex>
      </AppShell.Header>

      <AppShell.Main>
        <AppContent>
          <AppRoutes />
        </AppContent>
      </AppShell.Main>
    </AppShell>
  );
}
