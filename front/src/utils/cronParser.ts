export function parseCronExpression(cron: string): string {
  if (!cron) return "";

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;

  const [minute, hour, day, month, weekday] = parts;

  const parseField = (field: string, type: string): string => {
    if (field === "*") return `every ${type}`;
    if (field.includes("/")) {
      const [range, step] = field.split("/");
      if (range === "*") return `every ${step} ${type}s`;
      return `every ${step} ${type}s in range ${range}`;
    }
    if (field.includes("-")) return `${type}s ${field}`;
    if (field.includes(",")) return `${type}s ${field}`;
    return `${type} ${field}`;
  };

  const parts_readable = [];

  if (minute !== "*") parts_readable.push(parseField(minute, "minute"));
  if (hour !== "*") parts_readable.push(parseField(hour, "hour"));
  if (day !== "*") parts_readable.push(parseField(day, "day"));
  if (month !== "*") parts_readable.push(parseField(month, "month"));
  if (weekday !== "*") parts_readable.push(parseField(weekday, "weekday"));

  if (parts_readable.length === 0) return "every minute";

  return parts_readable.join(", ");
}
