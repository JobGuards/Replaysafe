import { prisma, MonitorStatus } from '@stillup/db'
import { incidentService } from '../services/IncidentService.js'

/**
 * Checks for monitors that have missed their expected heartbeats
 */
async function checkMissedHeartbeats() {
  const now = new Date()

  try {
    // 1. Find monitors that are UP but missed their next expected time
    const missedMonitors = await (prisma.monitor as any).findMany({
      where: {
        enabled: true,
        deletedAt: null,
        status: MonitorStatus.UP,
        nextExpectedAt: {
          lt: now,
        },
      },
    })

    if (missedMonitors.length === 0) return

    console.log(`[Worker] Found ${missedMonitors.length} monitors with missed heartbeats`)

    // 2. Mark them as DOWN
    // For now we do it one by one to potentially trigger alerts in the future
    // In a high-traffic system, a single updateMany might be better
    for (const monitor of missedMonitors) {
      await (prisma.monitor as any).update({
        where: { id: monitor.id },
        data: {
          status: MonitorStatus.DOWN,
        },
      })
      
      // Create incident
      await incidentService.createIncident(monitor.id, 'missed')
      
      console.log(`[Worker] Monitor ${monitor.name} (${monitor.id}) marked as DOWN and incident created due to missed heartbeat`)
    }
  } catch (error) {
    console.error('[Worker] Error checking missed heartbeats:', error)
  }
}

/**
 * Starts the background worker
 */
export function startMissedHeartbeatWorker(intervalMs: number = 60000) {
  console.log(`[Worker] Starting missed heartbeat detection worker (Interval: ${intervalMs}ms)`)
  
  // Run once on start
  checkMissedHeartbeats()

  // Then periodically
  const interval = setInterval(checkMissedHeartbeats, intervalMs)

  return () => clearInterval(interval)
}
