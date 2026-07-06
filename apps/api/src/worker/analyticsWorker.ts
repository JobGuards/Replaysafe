import { prisma } from "@replaysafe/db";
import { startOfDay, startOfWeek, subDays } from "date-fns";

import { healthScoreService } from "../services/HealthScoreService.js";
import { patternDetectionService } from "../services/PatternDetectionService.js";

/**
 * PR #38: Analytics Aggregation Worker
 *
 * Runs nightly at midnight to:
 * 1. Aggregate heartbeats into daily/weekly ExecutionSummary records
 * 2. Clean up heartbeat records older than 30 days
 */
let isDbConnected = true;

export async function runAnalyticsAggregation(): Promise<void> {
  const yesterday = subDays(new Date(), 1);
  const dayStart = startOfDay(yesterday);

  try {
    console.log(`[AnalyticsWorker] Aggregating for ${dayStart.toISOString()}`);

    // Get all enabled monitors
    const monitors = await (prisma as any).monitor.findMany({
      where: { enabled: true, deletedAt: null },
      select: { id: true },
    });

    if (!isDbConnected) {
      console.log("[AnalyticsWorker] Database connection restored");
      isDbConnected = true;
    }

    // 2. Refresh intelligence metrics (Health Score & Patterns) per monitor
    for (const monitor of monitors) {
      await aggregateDailySummary(monitor.id, dayStart);

      await healthScoreService
        .calculateAndUpdate(monitor.id)
        .catch((e) =>
          console.error(
            `[AnalyticsWorker] Health score failed for ${monitor.id}:`,
            e.message,
          ),
        );
      await patternDetectionService
        .analyzeMonitor(monitor.id)
        .catch((e) =>
          console.error(
            `[AnalyticsWorker] Pattern detection failed for ${monitor.id}:`,
            e.message,
          ),
        );
    }

    // 3. Project-Level Intelligence (Phase 5)
    const projects = await (prisma as any).project.findMany({
      select: { id: true, name: true },
    });
    console.log(
      `[AnalyticsWorker] Running project-level discovery for ${projects.length} projects`,
    );
    for (const project of projects) {
      await patternDetectionService
        .discoverCascadingFailures(project.id)
        .catch((e) =>
          console.error(
            `[AnalyticsWorker] Cascading discovery failed for ${project.name}:`,
            e.message,
          ),
        );
      await patternDetectionService
        .detectRecursiveRetries(project.id)
        .catch((e) =>
          console.error(
            `[AnalyticsWorker] Recursive detection failed for ${project.name}:`,
            e.message,
          ),
        );
    }

    // 4. Weekly summary every Monday
    if (yesterday.getDay() === 0) {
      const weekStart = startOfWeek(yesterday, { weekStartsOn: 1 });
      for (const monitor of monitors) {
        await aggregateWeeklySummary(monitor.id, weekStart);
      }
    }

    // Cleanup: delete heartbeats older than 30 days
    const cutoff = subDays(new Date(), 30);
    const deleted = await (prisma as any).heartbeat.deleteMany({
      where: { receivedAt: { lt: cutoff } },
    });
    console.log(`[AnalyticsWorker] Cleaned up ${deleted.count} old records`);
  } catch (error: any) {
    if (isDbConnected) {
      console.error(
        "[AnalyticsWorker] Connection error:",
        error.message || error,
      );
      isDbConnected = false;
    }
  }
}

async function aggregateDailySummary(
  monitorId: string,
  date: Date,
): Promise<void> {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const heartbeats = await (prisma as any).heartbeat.findMany({
    where: {
      monitorId,
      receivedAt: { gte: date, lt: nextDay },
    },
    select: { type: true, isLate: true, duration: true },
  });

  if (heartbeats.length === 0) return;

  const successCount = heartbeats.filter(
    (h: any) => h.type === "SUCCESS",
  ).length;
  const failureCount = heartbeats.filter(
    (h: any) => h.type === "FAILURE",
  ).length;
  const lateCount = heartbeats.filter((h: any) => h.isLate).length;
  const durations = heartbeats
    .filter((h: any) => h.duration != null)
    .map((h: any) => h.duration as number);
  const avgDuration =
    durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : null;
  const uptimePercent =
    heartbeats.length > 0 ? (successCount / heartbeats.length) * 100 : null;

  await (prisma as any).executionSummary.upsert({
    where: { monitorId_date_period: { monitorId, date, period: "daily" } },
    create: {
      monitorId,
      date,
      period: "daily",
      totalHeartbeats: heartbeats.length,
      successCount,
      failureCount,
      lateCount,
      avgDuration,
      uptimePercent,
    },
    update: {
      totalHeartbeats: heartbeats.length,
      successCount,
      failureCount,
      lateCount,
      avgDuration,
      uptimePercent,
    },
  });
}

async function aggregateWeeklySummary(
  monitorId: string,
  weekStart: Date,
): Promise<void> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const heartbeats = await (prisma as any).heartbeat.findMany({
    where: {
      monitorId,
      receivedAt: { gte: weekStart, lt: weekEnd },
    },
    select: { type: true, isLate: true, duration: true },
  });

  if (heartbeats.length === 0) return;

  const successCount = heartbeats.filter(
    (h: any) => h.type === "SUCCESS",
  ).length;
  const failureCount = heartbeats.filter(
    (h: any) => h.type === "FAILURE",
  ).length;
  const lateCount = heartbeats.filter((h: any) => h.isLate).length;
  const durations = heartbeats
    .filter((h: any) => h.duration != null)
    .map((h: any) => h.duration as number);
  const avgDuration =
    durations.length > 0
      ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
      : null;
  const uptimePercent =
    heartbeats.length > 0 ? (successCount / heartbeats.length) * 100 : null;

  await (prisma as any).executionSummary.upsert({
    where: {
      monitorId_date_period: { monitorId, date: weekStart, period: "weekly" },
    },
    create: {
      monitorId,
      date: weekStart,
      period: "weekly",
      totalHeartbeats: heartbeats.length,
      successCount,
      failureCount,
      lateCount,
      avgDuration,
      uptimePercent,
    },
    update: {
      totalHeartbeats: heartbeats.length,
      successCount,
      failureCount,
      lateCount,
      avgDuration,
      uptimePercent,
    },
  });
}

/**
 * Schedule this as a cron job. Example: run it daily at 00:05 UTC.
 * Can be called from a setInterval loop or cron scheduler.
 */
export function scheduleAnalyticsWorker(): void {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  // Run immediately on startup (catches missed runs after restarts)
  runAnalyticsAggregation().catch(console.error);

  // Check every 5 minutes whether it's time to run the daily job
  let lastRunDate = new Date().toDateString();
  setInterval(() => {
    const now = new Date();
    const today = now.toDateString();
    const isAfterMidnight = now.getHours() === 0 && now.getMinutes() < 10;

    if (isAfterMidnight && today !== lastRunDate) {
      lastRunDate = today;
      runAnalyticsAggregation().catch(console.error);
    }
  }, FIVE_MINUTES_MS);
}
