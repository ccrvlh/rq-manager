import { useWorkerThroughput } from "@/services/analytics/analyticsService";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconActivity } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TimePeriod } from "./TimePeriodSelector";

type WorkerThroughput = {
  timestamp: string;
  worker_name: string;
  throughput: number;
};

export function HomeWorkerThroughput({
  timePeriod,
}: {
  timePeriod: TimePeriod;
}) {
  const theme = useMantineTheme();
  const [evolutionData, setEvolutionData] = useState<
    Array<Record<string, string | number>>
  >([]);
  const { data: rawData = [] } = useWorkerThroughput(timePeriod);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!rawData || rawData.length === 0) return;
    // pivot rawData like { time, worker1: x, worker2: y }
    const grouped: Array<Record<string, string | number>> = [];
    (rawData as WorkerThroughput[]).forEach((d) => {
      let point = grouped.find((p) => p.time === d.timestamp);
      if (!point) {
        point = { time: d.timestamp };
        grouped.push(point);
      }
      point[d.worker_name] = d.throughput;
    });
    setEvolutionData(grouped);
  }, [rawData]);

  const workerNames = [
    ...new Set((rawData as WorkerThroughput[]).map((d) => d.worker_name)),
  ];

  const applyMovingAverage = (
    data: Array<Record<string, string | number>>,
    keys: string[],
    windowSize = 15
  ) => {
    const smoothed = [...data];
    keys.forEach((key) => {
      const vals = data.map((d) =>
        typeof d[key] === "number" ? (d[key] as number) : 0
      );
      const averaged: number[] = [];
      for (let i = 0; i < vals.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = vals.slice(start, i + 1);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        averaged.push(avg);
      }
      averaged.forEach((v, i) => {
        smoothed[i] = { ...smoothed[i], [key]: v };
      });
    });
    return smoothed;
  };

  useEffect(() => {
    if (!rawData || rawData.length === 0) return;
    const grouped: Array<Record<string, string | number>> = [];
    (rawData as WorkerThroughput[]).forEach((d) => {
      let point = grouped.find((p) => p.time === d.timestamp);
      if (!point) {
        point = { time: d.timestamp };
        grouped.push(point);
      }
      point[d.worker_name] = d.throughput;
    });
    // apply smoothing before state update
    const smoothed = applyMovingAverage(grouped, [
      ...new Set((rawData as WorkerThroughput[]).map((d) => d.worker_name)),
    ]);
    setEvolutionData(smoothed);
  }, [rawData]);

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="transparent" size="lg">
            <IconActivity size={16} />
          </ActionIcon>
          <Title order={4}>Worker Throughput</Title>
        </Group>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => navigate("/workers")}
        >
          {evolutionData?.length ? (
            <>{evolutionData.length} total</>
          ) : (
            <>No data</>
          )}
        </Button>
      </Group>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={evolutionData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis
            dataKey="time"
            style={{ fontSize: 12, fill: theme.colors.gray[6] }}
          />
          <YAxis style={{ fontSize: 12, fill: theme.colors.gray[6] }} />
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            height={24}
            onClick={(e) => {
              if (!e || !e.dataKey) return;
              const key = String(e.dataKey);
              setHiddenSeries((prev) => {
                const next = new Set(prev);
                if (next.has(key)) {
                  next.delete(key);
                } else {
                  next.add(key);
                }
                return next;
              });
            }}
          />
          <defs>
            {workerNames.map((workerName, idx) => {
              const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];
              const color = colors[idx % colors.length];
              return (
                <linearGradient
                  key={workerName}
                  id={`gradient-${workerName}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {workerNames.map((workerName, idx) => {
            const dataKey = workerName;
            const colors = ["#8884d8", "#82ca9d", "#ffc758ad", "#ff7300be"];
            return (
              <Area
                isAnimationActive={false}
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={colors[idx % colors.length]}
                fill={`url(#gradient-${workerName})`}
                name={workerName}
                hide={hiddenSeries.has(dataKey)}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}
