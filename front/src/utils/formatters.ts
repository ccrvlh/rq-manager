/**
 * Formats a date string or Date object into a localized string representation.
 * @param {string | Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
