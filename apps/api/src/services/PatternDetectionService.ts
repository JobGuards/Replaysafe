import { prisma } from '@stillup/db'
import { subDays, format, startOfHour } from 'date-fns'

export interface FailurePattern {
  type: 'RECURRING_TIME' | 'FLAPPING' | 'LATENCY_SPIKE'
  description: string
  occurrences: number
  lastSeen: Date
  severity: 'high' | 'medium' | 'low'
}

export class PatternDetectionService {
  async detectPatterns(monitorId: string): Promise<FailurePattern[]> {
    const cutoff = subDays(new Date(), 14)
    const failures = await (prisma.heartbeat as any).findMany({
      where: {
        monitorId,
        status: 'error',
        receivedAt: { gte: cutoff },
      },
      orderBy: { receivedAt: 'desc' },
    })

    const patterns: FailurePattern[] = []

    if (failures.length < 3) return patterns

    // 1. Detect Time-based patterns (e.g., fails every day at same hour)
    const hourCounts: Record<number, number> = {}
    failures.forEach((f: any) => {
      const hour = f.receivedAt.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count >= 3) {
        patterns.push({
          type: 'RECURRING_TIME',
          description: `Frequent failures detected around ${hour}:00. Possible maintenance window or scheduled task conflict.`,
          occurrences: count,
          lastSeen: failures[0].receivedAt,
          severity: count > 5 ? 'high' : 'medium',
        })
      }
    }

    // 2. Detect Flapping (many state changes in short time)
    // We'd need to look at state transitions, but for now we'll count total failures in last 24h
    const last24h = failures.filter((f: any) => f.receivedAt > subDays(new Date(), 1)).length
    if (last24h > 10) {
      patterns.push({
        type: 'FLAPPING',
        description: `Monitor is "flapping" with ${last24h} failures in the last 24 hours.`,
        occurrences: last24h,
        lastSeen: failures[0].receivedAt,
        severity: 'high',
      })
    }

    return patterns
  }
}

export const patternDetectionService = new PatternDetectionService()
