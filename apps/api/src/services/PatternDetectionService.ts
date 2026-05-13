import { prisma } from '@stillup/db'
import { subDays, format, startOfHour } from 'date-fns'
import { secretSentinelService } from './SecretSentinelService.js'

function log(msg: string) {
  // Logging disabled
}

export interface FailurePattern {
  type: 'RECURRING_TIME' | 'FLAPPING' | 'LATENCY_SPIKE'
  description: string
  occurrences: number
  lastSeen: Date
}

export class PatternDetectionService {
  async detectPatterns(monitorId: string): Promise<FailurePattern[]> {
    const cutoff = subDays(new Date(), 14)
    const failures = await (prisma.heartbeat as any).findMany({
      where: {
        monitorId,
        type: 'FAILURE',
        receivedAt: { gte: cutoff },
      },
      orderBy: { receivedAt: 'desc' },
    })

    const patterns: FailurePattern[] = []

    // 1. Detect Time-based patterns (e.g., fails every day at same hour)
    if (failures.length >= 3) {
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
          })
        }
      }
    }

    // 2. Detect Flapping (frequent UP/DOWN transitions)
    const flapping = await (prisma.heartbeat as any).findMany({
      where: { monitorId },
      orderBy: { receivedAt: 'desc' },
      take: 10
    })
    log(`[detectPatterns] Found ${flapping.length} heartbeats for flapping check`);

    // 3. Detect Latency Jitter (Statistical Anomaly)
    const recentHeartbeats = await (prisma.heartbeat as any).findMany({
      where: { monitorId },
      orderBy: { receivedAt: 'desc' },
      take: 50 // Larger sample for better stats
    })

    log(`[detectPatterns] Query for ${monitorId} returned ${recentHeartbeats.length} heartbeats`);

    const latencies = recentHeartbeats.map((h: any) => h.latency).filter((l: any) => l !== null) as number[]
    log(`[detectPatterns] Latencies: ${latencies.length} found. Samples: ${latencies.slice(0, 5).join(', ')}`);
    
    if (latencies.length >= 10) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
      const stdDev = Math.sqrt(latencies.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / latencies.length)
      
      const current = latencies[0]
      log(`[detectPatterns] Stats - Avg: ${Math.round(avg)}, StdDev: ${Math.round(stdDev)}, Current: ${current}`);
      if (current > avg + (2 * stdDev) && current > 200) {
        log(`[detectPatterns] JITTER DETECTED!`);
        patterns.push({
          type: 'LATENCY_SPIKE',
          description: `High Jitter Detected: Current latency (${current}ms) is significantly higher than the rolling average (${Math.round(avg)}ms ±${Math.round(stdDev)}ms).`,
          occurrences: 1,
          lastSeen: recentHeartbeats[0].receivedAt,
        })
      }
    }

    // 4. Detect Stale Handshakes (Security Risk)
    const staleHandshakes = recentHeartbeats.filter((h: any) => h.handshakeAge && h.handshakeAge > 3600).length // 1 hour threshold
    log(`[detectPatterns] Stale handshakes: ${staleHandshakes}`);
    if (staleHandshakes >= 1) {
        log(`[detectPatterns] STALE HANDSHAKE DETECTED!`);
      patterns.push({
        type: 'FLAPPING',
        description: `Stale tunnel handshakes detected. The secure tunnel may be functionally disconnected even if the process is running.`,
        occurrences: staleHandshakes,
        lastSeen: recentHeartbeats[0].receivedAt,
      })
    }

    return patterns
  }

  /**
   * Analyze a monitor for failure patterns and persist active ones
   */
  async analyzeMonitor(monitorId: string): Promise<void> {
    try {
      log(`Analyzing monitor: ${monitorId}`);
      const patterns = await this.detectPatterns(monitorId)
      log(`Detected ${patterns.length} patterns: ${JSON.stringify(patterns)}`);
      
      const monitor = await (prisma as any).monitor.findUnique({
        where: { id: monitorId },
        select: { projectId: true }
      })
      
      // First, mark all existing patterns for this monitor as inactive
      // BUT exclude SECRET_RISK which are managed by runSecurityAudit
      const updateRes = await (prisma as any).failurePattern.updateMany({
        where: { 
          monitorId, 
          active: true,
          type: { not: 'SECRET_RISK' }
        },
        data: { active: false },
      })
      log(`Deactivated ${updateRes.count} old patterns`);

      if (monitor) {
        log(`Running security audit for project: ${monitor.projectId}`);
        await secretSentinelService.runSecurityAudit(monitor.projectId)
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
            active: true
          }
        })
        log(`Created pattern: ${createRes.id} (${pattern.type})`);
      }
    } catch (err: any) {
      log(`DB Error: ${err.message}`);
    }
  }
}

export const patternDetectionService = new PatternDetectionService()
