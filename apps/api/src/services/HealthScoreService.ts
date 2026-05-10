import { prisma } from '@stillup/db'
import { subDays } from 'date-fns'

export interface HealthScore {
  score: number // 0-100
  uptime: number // 0-100
  avgLatency: number // ms
  jitter: number // variability in ms
  status: 'optimal' | 'warning' | 'critical'
}

export class HealthScoreService {
  /**
   * Calculate health score for a monitor based on the last N days
   */
  async calculateScore(monitorId: string, days: number = 7): Promise<HealthScore> {
    const startDate = subDays(new Date(), days)

    // Fetch heartbeats
    const heartbeats = await (prisma.heartbeat as any).findMany({
      where: {
        monitorId,
        receivedAt: { gte: startDate },
      },
      orderBy: { receivedAt: 'desc' },
      take: 1000,
    })

    if (heartbeats.length === 0) {
      return { score: 100, uptime: 100, avgLatency: 0, jitter: 0, status: 'optimal' }
    }

    // 1. Uptime Score
    const successful = heartbeats.filter((h: any) => h.status === 'success').length
    const uptime = (successful / heartbeats.length) * 100

    // 2. Latency Score
    const latencies = heartbeats
      .filter((h: any) => h.latencyMs !== null)
      .map((h: any) => h.latencyMs)
    
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length
      : 0

    // 3. Jitter (Standard Deviation of latency)
    const jitter = latencies.length > 1
      ? Math.sqrt(
          latencies.map(x => Math.pow(x - avgLatency, 2)).reduce((a, b) => a + b) / latencies.length
        )
      : 0

    // Calculate final weighted score
    // Uptime is 70% of score, Latency stability is 30%
    const uptimeComponent = uptime * 0.7
    
    // Latency penalty (starts after 500ms, maxes at 3s)
    const latencyPenalty = Math.min(Math.max((avgLatency - 500) / 25, 0), 30)
    
    let score = Math.max(uptimeComponent + (30 - latencyPenalty), 0)

    // Status mapping
    let status: 'optimal' | 'warning' | 'critical' = 'optimal'
    if (score < 70 || uptime < 95) status = 'critical'
    else if (score < 90 || uptime < 99) status = 'warning'

    return {
      score: Math.round(score),
      uptime: Math.round(uptime * 10) / 10,
      avgLatency: Math.round(avgLatency),
      jitter: Math.round(jitter),
      status,
    }
  }
}

export const healthScoreService = new HealthScoreService()
