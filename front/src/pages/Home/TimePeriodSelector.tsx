import { Button, Popover, Select, Stack } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar, IconClock } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";

export interface TimePeriod {
  period?: string;
  startDate?: Date;
  endDate?: Date;
}

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const PRESETS = [
  { value: "30m", label: "Last 30 minutes" },
  { value: "1h", label: "Last 1 hour" },
  { value: "3h", label: "Last 3 hours" },
  { value: "6h", label: "Last 6 hours" },
  { value: "12h", label: "Last 12 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function TimePeriodSelector({
  value,
  onChange,
}: TimePeriodSelectorProps) {
  const [opened, setOpened] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(
    value.startDate || null
  );
  const [customEnd, setCustomEnd] = useState<Date | null>(
    value.endDate || null
  );

  const handlePresetChange = (period: string | null) => {
    if (period) {
      const now = dayjs();
      let start: Date;
      switch (period) {
        case "30m":
          start = now.subtract(30, "minute").toDate();
          break;
        case "1h":
          start = now.subtract(1, "hour").toDate();
          break;
        case "3h":
          start = now.subtract(3, "hour").toDate();
          break;
        case "6h":
          start = now.subtract(6, "hour").toDate();
          break;
        case "12h":
          start = now.subtract(12, "hour").toDate();
          break;
        case "24h":
          start = now.subtract(24, "hour").toDate();
          break;
        case "7d":
          start = now.subtract(7, "day").toDate();
          break;
        case "30d":
          start = now.subtract(30, "day").toDate();
          break;
        default:
          start = now.subtract(24, "hour").toDate();
      }
      onChange({ period, startDate: start, endDate: now.toDate() });
      setOpened(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        startDate: customStart,
        endDate: customEnd,
      });
      setOpened(false);
    }
  };

  const getDisplayLabel = () => {
    if (value.period) {
      const preset = PRESETS.find((p) => p.value === value.period);
      return preset?.label || "Select period";
    }
    if (value.startDate && value.endDate) {
      return `${dayjs(value.startDate).format("MMM D")} - ${dayjs(
        value.endDate
      ).format("MMM D")}`;
    }
    return "Select period";
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      withArrow
    >
      <Popover.Target>
        <Button
          variant="light"
          leftSection={<IconClock size={16} />}
          onClick={() => setOpened(!opened)}
        >
          {getDisplayLabel()}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="md" w={300}>
          <Select
            label="Quick presets"
            placeholder="Select a preset"
            data={PRESETS}
            value={value.period || null}
            onChange={handlePresetChange}
          />

          <Stack gap="xs">
            <DatePickerInput
              label="Custom start date"
              placeholder="Pick start date"
              value={customStart}
              onChange={(value) =>
                setCustomStart(value ? new Date(value) : null)
              }
              leftSection={<IconCalendar size={16} />}
              maxDate={new Date()}
            />
            <DatePickerInput
              label="Custom end date"
              placeholder="Pick end date"
              value={customEnd}
              onChange={(value) => setCustomEnd(value ? new Date(value) : null)}
              leftSection={<IconCalendar size={16} />}
              maxDate={new Date()}
              minDate={customStart || undefined}
            />
            <Button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              size="sm"
            >
              Apply Custom Range
            </Button>
          </Stack>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
