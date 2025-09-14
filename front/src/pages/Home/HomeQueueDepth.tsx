import { useQueueDepth } from "@/services/analytics/analyticsService";
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconStackBackward } from "@tabler/icons-react";
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
export function HomeQueueDepth({ timePeriod }: { timePeriod: TimePeriod }) {
  const theme = useMantineTheme();
  const TOTAL_POINTS = 300;
  const [evolutionData, setEvolutionData] = useState<
    Array<Record<string, string | number>>
  >([]);
  const { data: rawData = [] } = useQueueDepth(timePeriod);

  useEffect(() => {
    if (rawData.length === 0) return;
    setEvolutionData((prev) => {
      if (prev.length === 0) {
        const grouped: Array<Record<string, number | string>> = [];
        rawData.forEach((d) => {
          let point = grouped.find((p) => p.time === d.timestamp) as
            | Record<string, number | string>
            | undefined;

          if (!point) {
            point = { time: d.timestamp };
            grouped.push(point);
          }

          point[d.queue_name] = d.queued_jobs;
        });
        return grouped;
      } else {
        const latest = rawData[rawData.length - 1];
        const nextPoint: Record<string, number | string> = {
          time: latest.timestamp,
        };
        nextPoint[latest.queue_name] = latest.queued_jobs;
        return [...prev.slice(-TOTAL_POINTS + 1), nextPoint];
      }
    });
  }, [rawData]);

  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const queueNames = [...new Set(rawData.map((d) => d.queue_name))];

  useEffect(() => {
    if (evolutionData.length > 0 && hiddenSeries.size === 0) {
      const initialHidden = new Set<string>();
      queueNames.forEach((queueName) => {
        ["started"].forEach((status) => {
          initialHidden.add(`${queueName}_${status}`);
        });
      });
      setHiddenSeries(initialHidden);
    }
  }, [evolutionData, queueNames]);

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon variant="transparent" size="lg">
            <IconStackBackward size={16} />
          </ActionIcon>
          <Title order={4}>Queue Depth</Title>
        </Group>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => navigate("/queues")}
        >
          {evolutionData?.length ? (
            <>{evolutionData.length} total</>
          ) : (
            <>No data</>
          )}
        </Button>
      </Group>
      <ResponsiveContainer
        width="100%"
        height={400}
        style={{
          transition: "transform 1s linear",
          transform: "translateX(-20px)",
        }}
      >
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
          <defs>
            {queueNames.map((queueName, queueIndex) => {
              const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];
              const color = colors[queueIndex % colors.length];
              return (
                <linearGradient
                  key={queueName}
                  id={`gradient-${queueName}`}
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

          {queueNames.map((queueName, queueIndex) => {
            const dataKey = queueName;
            const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];
            return (
              <Area
                isAnimationActive={false}
                key={dataKey}
                type="monotone"
                dataKey={dataKey}
                stroke={colors[queueIndex % colors.length]}
                fill={`url(#gradient-${queueName})`}
                name={queueName}
                hide={hiddenSeries.has(dataKey)}
              />
            );
          })}
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
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}
