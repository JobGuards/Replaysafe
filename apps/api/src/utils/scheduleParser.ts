import { CronExpressionParser } from "cron-parser";

/**
 * Calculates the next expected date for a heartbeat based on the schedule.
 */
export function getNextExpectedDate(
  schedule: string,
  scheduleType: "CRON" | "SIMPLE" = "CRON",
  timezone: string = "UTC",
): Date {
  if (scheduleType === "CRON") {
    try {
      const interval = CronExpressionParser.parse(schedule, { tz: timezone });
      return interval.next().toDate();
    } catch (err: any) {
      throw new Error(
        `Invalid cron expression: ${schedule}. Error: ${err.message}`,
      );
    }
  }

  if (scheduleType === "SIMPLE") {
    // Expected format: "every X minutes", "every X hours", "every X days"
    const match = schedule.match(/every\s+(\d+)\s+(minute|hour|day)s?/i);
    if (!match) {
      throw new Error(`Invalid simple schedule format: ${schedule}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const now = new Date();

    if (unit.startsWith("minute")) {
      return new Date(now.getTime() + value * 60 * 1000);
    } else if (unit.startsWith("hour")) {
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    } else if (unit.startsWith("day")) {
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    }
  }

  throw new Error(`Unsupported schedule type: ${scheduleType}`);
}
