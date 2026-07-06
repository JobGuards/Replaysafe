import { prisma } from "@replaysafe/db";
import {
  subDays,
  format,
  startOfHour,
  subHours,
  differenceInMinutes,
} from "date-fns";
import { secretSentinelService } from "./SecretSentinelService.js";

function log(msg: string) {
  // Logging disabled
}

export interface FailurePattern {
  type:
    "RECURRING_TIME" | "FLAPPING" | "LATENCY_SPIKE" | "CASCADING" | "STREAK";
  description: string;
  occurrences: number;
  lastSeen: Date;
  metadata?: any;
}

export class PatternDetectionService {
  async detectPatterns(monitorId: string): Promise<FailurePattern[]> {
    const cutoff = subDays(new Date(), 14);
    const failures = await (prisma.heartbeat as any).findMany({
      where: {
        monitorId,
        type: "FAILURE",
        receivedAt: { gte: cutoff },
      },
      orderBy: { receivedAt: "desc" },
    });

    const patterns: FailurePattern[] = [];

    // 1. Detect Time-based patterns (e.g., fails every day at same hour)
    if (failures.length >= 3) {
      const hourCounts: Record<number, number> = {};
      failures.forEach((f: any) => {
        const hour = f.receivedAt.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      for (const [hour, count] of Object.entries(hourCounts)) {
        if (count >= 3) {
          patterns.push({
            type: "RECURRING_TIME",
            description: `Frequent failures detected around ${hour}:00. Possible maintenance window or scheduled task conflict.`,
            occurrences: count,
            lastSeen: failures[0].receivedAt,
          });
        }
      }
    }

    // 2. Detect Flapping (frequent UP/DOWN transitions)
    const flapping = await (prisma.heartbeat as any).findMany({
      where: { monitorId },
      orderBy: { receivedAt: "desc" },
      take: 10,
    });
    log(
      `[detectPatterns] Found ${flapping.length} heartbeats for flapping check`,
    );

    // 3. Detect Latency Jitter (Statistical Anomaly)
    const recentHeartbeats = await (prisma.heartbeat as any).findMany({
      where: { monitorId },
      orderBy: { receivedAt: "desc" },
      take: 50, // Larger sample for better stats
    });

    log(
      `[detectPatterns] Query for ${monitorId} returned ${recentHeartbeats.length} heartbeats`,
    );

    const latencies = recentHeartbeats
      .map((h: any) => h.latency)
      .filter((l: any) => l !== null) as number[];
    log(
      `[detectPatterns] Latencies: ${latencies.length} found. Samples: ${latencies.slice(0, 5).join(", ")}`,
    );

    if (latencies.length >= 10) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const stdDev = Math.sqrt(
        latencies.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) /
          latencies.length,
      );

      const current = latencies[0];
      log(
        `[detectPatterns] Stats - Avg: ${Math.round(avg)}, StdDev: ${Math.round(stdDev)}, Current: ${current}`,
      );
      if (current > avg + 2 * stdDev && current > 200) {
        log(`[detectPatterns] JITTER DETECTED!`);
        patterns.push({
          type: "LATENCY_SPIKE",
          description: `High Jitter Detected: Current latency (${current}ms) is significantly higher than the rolling average (${Math.round(avg)}ms ±${Math.round(stdDev)}ms).`,
          occurrences: 1,
          lastSeen: recentHeartbeats[0].receivedAt,
        });
      }
    }

    // 4. Detect Stale Handshakes (Security Risk)
    const staleHandshakes = recentHeartbeats.filter(
      (h: any) => h.handshakeAge && h.handshakeAge > 3600,
    ).length; // 1 hour threshold
    log(`[detectPatterns] Stale handshakes: ${staleHandshakes}`);
    if (staleHandshakes >= 1) {
      log(`[detectPatterns] STALE HANDSHAKE DETECTED!`);
      patterns.push({
        type: "FLAPPING",
        description: `Stale tunnel handshakes detected. The secure tunnel may be functionally disconnected even if the process is running.`,
        occurrences: staleHandshakes,
        lastSeen: recentHeartbeats[0].receivedAt,
      });
    }

    return patterns;
  }

  /**
   * Analyze a monitor for failure patterns and persist active ones
   */
  async analyzeMonitor(monitorId: string): Promise<void> {
    try {
      log(`Analyzing monitor: ${monitorId}`);
      const patterns = await this.detectPatterns(monitorId);
      log(`Detected ${patterns.length} patterns: ${JSON.stringify(patterns)}`);

      const monitor = await (prisma as any).monitor.findUnique({
        where: { id: monitorId },
        select: { projectId: true },
      });

      // First, mark all existing patterns for this monitor as inactive
      // BUT exclude SECRET_RISK which are managed by runSecurityAudit
      const updateRes = await (prisma as any).failurePattern.updateMany({
        where: {
          monitorId,
          active: true,
          type: { not: "SECRET_RISK" },
        },
        data: { active: false },
      });
      log(`Deactivated ${updateRes.count} old patterns`);

      if (monitor) {
        log(`Running security audit for project: ${monitor.projectId}`);
        await secretSentinelService.runSecurityAudit(monitor.projectId);
      }

      // Upsert detected patterns
      for (const pattern of patterns) {
        const createRes = await (prisma as any).failurePattern.create({
          data: {
            monitorId,
            type: pattern.type,
            description: pattern.description,
            occurrences: pattern.occurrences,
            lastSeenAt: pattern.lastSeen,
            confidence: Math.min(pattern.occurrences / 10, 1.0),
            active: true,
          },
        });
        log(`Created pattern: ${createRes.id} (${pattern.type})`);
      }
    } catch (err: any) {
      log(`DB Error: ${err.message}`);
    }
  }

  /**
   * Phase 5: Scans recent incidents to find cascading failure patterns.
   * A cascading failure is defined as Monitor B failing shortly after Monitor A.
   */
  async discoverCascadingFailures(projectId: string): Promise<void> {
    const yesterday = subHours(new Date(), 24);
    const incidents = await (prisma as any).incident.findMany({
      where: {
        monitor: { projectId },
        startedAt: { gte: yesterday },
      },
      orderBy: { startedAt: "asc" },
    });

    if (incidents.length < 2) return;

    const patterns: Array<{
      monitorA: string;
      monitorB: string;
      count: number;
    }> = [];

    for (let i = 0; i < incidents.length - 1; i++) {
      const incidentA = incidents[i];
      for (let j = i + 1; j < incidents.length; j++) {
        const incidentB = incidents[j];
        if (incidentA.monitorId === incidentB.monitorId) continue;
        const diff = differenceInMinutes(
          new Date(incidentB.startedAt),
          new Date(incidentA.startedAt),
        );
        if (diff >= 0 && diff <= 10) {
          const existing = patterns.find(
            (p) =>
              p.monitorA === incidentA.monitorId &&
              p.monitorB === incidentB.monitorId,
          );
          if (existing) existing.count++;
          else
            patterns.push({
              monitorA: incidentA.monitorId,
              monitorB: incidentB.monitorId,
              count: 1,
            });
        } else if (diff > 10) break;
      }
    }

    const strongPatterns = patterns.filter((p) => p.count >= 2);

    for (const pattern of strongPatterns) {
      const monitorA = await (prisma as any).monitor.findUnique({
        where: { id: pattern.monitorA },
        select: { name: true },
      });
      const monitorB = await (prisma as any).monitor.findUnique({
        where: { id: pattern.monitorB },
        select: { name: true },
      });

      const description = `Monitor "${monitorB.name}" often fails shortly after "${monitorA.name}" (detected ${pattern.count} times).`;

      const existing = await (prisma as any).failurePattern.findFirst({
        where: {
          monitorId: pattern.monitorB,
          type: "CASCADING",
          metadata: {
            path: ["path"],
            equals: [pattern.monitorA, pattern.monitorB],
          } as any,
          active: true,
        },
      });

      if (existing) {
        await (prisma as any).failurePattern.update({
          where: { id: existing.id },
          data: {
            occurrences: pattern.count,
            lastSeenAt: new Date(),
            description,
          },
        });
      } else {
        await (prisma as any).failurePattern.create({
          data: {
            monitorId: pattern.monitorB,
            type: "CASCADING",
            description,
            confidence: 0.8,
            metadata: {
              monitorA: pattern.monitorA,
              monitorA_name: monitorA.name,
              count: pattern.count,
              path: [pattern.monitorA, pattern.monitorB],
            },
            occurrences: pattern.count,
            active: true,
          },
        });
      }
    }
  }

  /**
   * Phase 5: Detects "Recursive Retries" where a job is stuck in a loop.
   */
  async detectRecursiveRetries(projectId: string): Promise<void> {
    const threeHoursAgo = subHours(new Date(), 3);
    const highAttempts = await (prisma as any).guardExecution.findMany({
      where: {
        monitor: { projectId },
        startedAt: { gte: threeHoursAgo },
        attempt: { gte: 5 },
        status: "RUNNING",
      },
      include: { monitor: { select: { id: true, name: true } } },
    });

    for (const exec of highAttempts) {
      // Check if we already flagged this execution
      const existing = await (prisma as any).failurePattern.findFirst({
        where: { monitorId: exec.monitor.id, type: "STREAK", active: true },
      });

      if (!existing) {
        await (prisma as any).failurePattern.create({
          data: {
            monitorId: exec.monitor.id,
            type: "STREAK",
            description: `Monitor "${exec.monitor.name}" is experiencing excessive retries (Attempt #${exec.attempt}). Potential recursive failure detected.`,
            confidence: 0.9,
            metadata: { executionId: exec.id, attempt: exec.attempt },
            active: true,
          },
        });
      }
    }
  }
}

export const patternDetectionService = new PatternDetectionService();
