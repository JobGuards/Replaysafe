import { prisma, MonitorStatus } from '@replaysafe/db'
import { incidentService } from '../services/IncidentService.js'

let isDbConnected = true

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

    if (!isDbConnected) {
      console.log('[Worker] Database connection restored')
      isDbConnected = true
    }

    if (missedMonitors.length === 0) return

    console.log(`[Worker] Found ${missedMonitors.length} monitors with missed heartbeats`)

    // 2. Mark them as DOWN
    for (const monitor of missedMonitors) {
      await (prisma.monitor as any).update({
        where: { id: monitor.id },
        data: {
          status: MonitorStatus.DOWN,
        },
      })
      
      // Create incident
      await incidentService.createIncident(monitor.id, 'missed')
      
      console.log(`[Worker] Monitor ${monitor.name} (${monitor.id}) marked as DOWN and incident created`)
    }
  } catch (error: any) {
    if (isDbConnected) {
      console.error('[Worker] Connection error - stopping log spam until restored:', error.message || error)
      isDbConnected = false
    }
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
