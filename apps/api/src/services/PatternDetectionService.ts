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

    // 3. Detect Latency Spikes (for Tunnelight)
    const recentHeartbeats = await (prisma.heartbeat as any).findMany({
      where: { monitorId },
      orderBy: { receivedAt: 'desc' },
      take: 20
    })

    const latencySpikes = recentHeartbeats.filter((h: any) => h.latency && h.latency > 1000).length
    if (latencySpikes >= 3) {
      patterns.push({
        type: 'LATENCY_SPIKE',
        description: `High latency detected in ${latencySpikes} of the last 20 heartbeats. Tunnel performance is degrading.`,
        occurrences: latencySpikes,
        lastSeen: recentHeartbeats[0].receivedAt,
        severity: 'medium',
      })
    }

    // 4. Detect Stale Handshakes (Security Risk)
    const staleHandshakes = recentHeartbeats.filter((h: any) => h.handshakeAge && h.handshakeAge > 3600).length // 1 hour threshold
    if (staleHandshakes >= 1) {
      patterns.push({
        type: 'FLAPPING',
        description: `Stale tunnel handshakes detected. The secure tunnel may be functionally disconnected even if the process is running.`,
        occurrences: staleHandshakes,
        lastSeen: recentHeartbeats[0].receivedAt,
        severity: 'high',
      })
    }

    return patterns
  }
}

export const patternDetectionService = new PatternDetectionService()
