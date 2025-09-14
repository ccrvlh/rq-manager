import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons-react";

export function AppThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";
  return (
    <ActionIcon
      variant="subtle"
      size="md"
      onClick={() => toggleColorScheme()}
      title="Toggle color scheme"
      c={colorScheme === "light" ? "white" : undefined}
    >
      {dark ? <IconSun size={16} /> : <IconMoonStars size={16} />}
    </ActionIcon>
  );
}
