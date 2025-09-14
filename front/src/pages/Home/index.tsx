import { Container, Grid, Stack } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { HomeFailedJobs } from "./HomeFailedJobs";
import { HomeHeader } from "./HomeHeader";
import { HomeQueueDepth } from "./HomeQueueDepth";
import { HomeQueueDetails } from "./HomeQueueDetails";
import { HomeRecentJobs } from "./HomeRecentJobs";
import { HomeStats } from "./HomeStats";
import { HomeWorkerStatus } from "./HomeWorkerStatus";
import { HomeWorkerThroughput } from "./HomeWorkerThroughput";
import { TimePeriod } from "./TimePeriodSelector";

dayjs.extend(relativeTime);

export function Home() {
  const now = dayjs();
  const [timePeriod] = useState<TimePeriod>({
    period: "5m",
    startDate: now.subtract(5, "minute").toDate(),
    endDate: now.toDate(),
  });

  return (
    <Container size="xl" fluid>
      <Stack gap="md">
        <HomeHeader />
        <HomeStats />

        <Grid gutter="xl">
          <Grid.Col span={6}>
            <HomeQueueDepth timePeriod={timePeriod} />
          </Grid.Col>

          <Grid.Col span={6}>
            <HomeWorkerThroughput timePeriod={timePeriod} />
          </Grid.Col>

          <Grid.Col span={8}>
            <HomeQueueDetails />
          </Grid.Col>

          <Grid.Col span={4}>
            <HomeWorkerStatus />
          </Grid.Col>

          <Grid.Col span={8}>
            <HomeRecentJobs />
          </Grid.Col>

          <Grid.Col span={4}>
            <HomeFailedJobs />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
