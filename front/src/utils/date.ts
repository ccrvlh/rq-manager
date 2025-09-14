import moment from "moment";

export class DateUtils {
  static formatDate(date: string) {
    const momentDate = moment(date);
    return momentDate.format("MMMM Do YYYY");
  }

  static normalizeToUTC(date: Date) {
    return new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      )
    );
  }

  static removeZone(date: string): Date {
    return new Date(date.replace(/(Z)/g, ""));
  }

  static toISOWithoutTimezone(date: Date): string {
    const utcDate = DateUtils.normalizeToUTC(date);
    const iso = utcDate.toISOString();
    return iso.replace(/Z.*/, "");
  }

  static getTimeRemaining(targetDate: string) {
    const total = new Date(targetDate).getTime() - new Date().getTime();

    // Handle case where date is in the past
    if (total <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return {
      days,
      hours,
      minutes,
      seconds,
    };
  }

  /**
   * Converts a UTC date to the specified timezone
   * @param utcDate - The UTC date string or Date object
   * @param timezone - The target timezone (e.g., 'America/Sao_Paulo')
   * @returns Date object in the specified timezone
   */
  static convertUtcToTimezone(
    utcDate: string | Date | null,
    timezone: string | null
  ): Date | null {
    if (!utcDate || !timezone) return null;

    try {
      const date =
        typeof utcDate === "string" ? new Date(utcDate + "Z") : utcDate;
      const offset = DateUtils.getTimezoneOffset(date, timezone);
      return new Date(date.getTime() + offset * 60 * 1000);
    } catch (error) {
      console.error("Error converting UTC to timezone:", error);
      return null;
    }
  }

  /**
   * Converts a local date to UTC for server storage
   * @param localDate - The local date string or Date object
   * @param timezone - The timezone of the local date
   * @returns UTC Date object
   */
  static convertTimezoneToUtc(
    localDate: string | Date | null,
    timezone: string | null
  ): Date | null {
    if (!localDate || !timezone) return null;

    try {
      const date =
        typeof localDate === "string" ? new Date(localDate + "Z") : localDate;
      const offset = DateUtils.getTimezoneOffset(date, timezone);
      return new Date(date.getTime() - offset * 60 * 1000);
    } catch (error) {
      console.error("Error converting timezone to UTC:", error);
      return null;
    }
  }

  /**
   * Gets the timezone offset in minutes for a given date and timezone
   * @param date - The date to get the offset for
   * @param timezone - The timezone identifier
   * @returns Offset in minutes
   */
  private static getTimezoneOffset(date: Date, timezone: string): number {
    try {
      // Create a formatter for the specified timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });

      // Get the parts for the date in the specified timezone
      const parts = formatter.formatToParts(date);
      const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
      const month =
        parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
      const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");
      const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
      const minute = parseInt(
        parts.find((p) => p.type === "minute")?.value || "0"
      );

      // Create a date object for the timezone
      const tzDate = new Date(year, month, day, hour, minute);

      // Calculate the offset in minutes
      return (tzDate.getTime() - date.getTime()) / (60 * 1000);
    } catch (error) {
      console.error("Error getting timezone offset:", error);
      return 0;
    }
  }

  /**
   * Formats a date for display in the specified timezone
   * @param date - The date to format
   * @param timezone - The target timezone
   * @param formatString - The format string (default: 'YYYY-MM-DD HH:mm:ss')
   * @returns Formatted date string
   */
  static formatDateInTimezone(
    date: string | Date | null,
    timezone: string | null,
    formatString: string = "YYYY-MM-DD HH:mm:ss"
  ): string {
    if (!date || !timezone) return "";

    try {
      const zonedDate = DateUtils.convertUtcToTimezone(date, timezone);
      return zonedDate ? moment(zonedDate).format(formatString) : "";
    } catch (error) {
      console.error("Error formatting date in timezone:", error);
      return "";
    }
  }
}
