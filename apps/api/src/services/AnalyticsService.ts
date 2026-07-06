import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Calculates the Safety ROI and Replay Intelligence stats for a project.
   */
  static async getSafetyROI(projectId: string, days: number = 30) {
    const startDate = subDays(startOfDay(new Date()), days);

    // 1. Count Prevented Duplicate Side Effects
    const preventedDuplicates = await prisma.guardSideEffect.count({
      where: {
        projectId,
        status: "SKIPPED",
        executedAt: { gte: startDate },
      },
    });

    // 2. Execution Recovery Stats
    const totalExecutions = await prisma.guardExecution.count({
      where: {
        monitor: { projectId },
        startedAt: { gte: startDate },
      },
    });

    const recoveryExecutions = await prisma.guardExecution.count({
      where: {
        monitor: { projectId },
        attempt: { gt: 1 },
        status: "SUCCESS",
        startedAt: { gte: startDate },
      },
    });

    // 3. Estimated Savings (ROI)
    // Constants for estimation - in a real app, these could be configurable
    const DOLLARS_PER_SKIP = 5.0; // Estimated cost of a duplicate side effect (support/refunds/API costs)
    const MINUTES_PER_SKIP = 2; // Estimated engineer time saved per automatic deduplication

    return {
      preventedDuplicates,
      totalExecutions,
      recoveryExecutions,
      estimatedDollarsSaved: preventedDuplicates * DOLLARS_PER_SKIP,
      estimatedMinutesSaved: preventedDuplicates * MINUTES_PER_SKIP,
      retrySuccessRate:
        totalExecutions > 0
          ? Math.round((recoveryExecutions / totalExecutions) * 100)
          : 0,
    };
  }

  /**
   * Returns a daily trend of prevented duplicates.
   */
  static async getDeduplicationTrend(projectId: string, days: number = 7) {
    const startDate = subDays(startOfDay(new Date()), days);

    const skips = await prisma.guardSideEffect.groupBy({
      by: ["executedAt"],
      where: {
        projectId,
        status: "SKIPPED",
        executedAt: { gte: startDate },
      },
      _count: true,
    });

    // Map to simple daily format
    const trendMap = new Map<string, number>();
    skips.forEach((s) => {
      const dateStr = s.executedAt.toISOString().split("T")[0];
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + s._count);
    });

    return Array.from(trendMap.entries())
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
