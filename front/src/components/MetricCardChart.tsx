import { Box, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MetricCardChartProps {
  value: number;
  label: string;
  data: { time: number; value: number }[];
  color?: string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  formatValue?: (value: number) => string;
  tooltipLabel?: string;
}

export function MetricCardChart({
  value,
  data,
  color = "red",
  unit = "",
  formatValue,
  tooltipLabel = "jobs",
}: MetricCardChartProps) {
  const { colorScheme } = useMantineColorScheme();
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>(
    []
  );

  const getChartColor = () => {
    if (colorScheme === "dark") {
      return {
        fill: `var(--mantine-color-${color}-9)`,
        stroke: `var(--mantine-color-${color}-7)`,
      };
    }
    return {
      fill: `var(--mantine-color-${color}-1)`,
      stroke: `var(--mantine-color-${color}-5)`,
    };
  };

  const chartColors = getChartColor();
  const displayValue = formatValue
    ? formatValue(value)
    : value.toLocaleString() + unit;

  useEffect(() => {
    if (data.length > 0) {
      setChartData(data);
    }
  }, [data]);

  return (
    <Box
      style={{
        position: "relative",
        height: "120px",
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Background Chart */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.6,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`color${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartColors.stroke}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartColors.stroke}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            <YAxis axisLine={false} tickLine={false} tick={false} width={0} />
            <Tooltip
              contentStyle={{
                backgroundColor:
                  colorScheme === "dark"
                    ? "var(--mantine-color-dark-8)"
                    : "white",
                border:
                  colorScheme === "dark"
                    ? `1px solid ${chartColors.stroke}`
                    : `1px solid var(--mantine-color-gray-3)`,
                borderRadius: "var(--mantine-radius-sm)",
              }}
              labelStyle={{
                color: colorScheme === "dark" ? "white" : "black",
                fontSize: "12px",
              }}
              formatter={(value, _, props) => {
                if (data.length >= 24) {
                  const hoursAgo =
                    props.payload?.time !== undefined ? props.payload.time : 0;
                  return [
                    `${value} ${tooltipLabel}`,
                    hoursAgo === 0 ? "Now" : `${hoursAgo}h ago`,
                  ];
                }
                return [`${value} ${tooltipLabel}`, ""];
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColors.stroke}
              fill={`url(#color${color})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: chartColors.stroke }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Foreground Content */}
      <Box
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
        }}
      >
        <Stack gap={2} align="center">
          <Text
            fw={800}
            size="xl"
            c={colorScheme === "dark" ? `${color}.2` : `${color}.9`}
            style={{
              textShadow:
                colorScheme === "dark"
                  ? "0 1px 2px rgba(0,0,0,0.5)"
                  : "0 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            {displayValue}
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
