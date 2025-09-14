import { Grid } from "@mantine/core";

export function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <Grid>
      <Grid.Col span={{ base: 0, sm: 0, md: 1, lg: 2 }}></Grid.Col>
      <Grid.Col span={{ base: 12, sm: 12, md: 10, lg: 8 }}>{children}</Grid.Col>
      <Grid.Col span={{ base: 0, sm: 0, md: 1, lg: 2 }}></Grid.Col>
    </Grid>
  );
}
