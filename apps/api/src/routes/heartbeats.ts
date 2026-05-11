import { Router } from 'express'
import { monitorRepository } from '../repositories/MonitorRepository.js'
import { heartbeatRepository } from '../repositories/HeartbeatRepository.js'
import { getNextExpectedDate } from '../utils/scheduleParser.js'
import { heartbeatRateLimiter } from '../middleware/rateLimit.js'
import { incidentService } from '../services/IncidentService.js'
import { healthScoreService } from '../services/HealthScoreService.js'
import { patternDetectionService } from '../services/PatternDetectionService.js'

const router = Router()

/**
 * Handle Heartbeat Ingestion
 * Supports both GET (simple) and POST (detailed)
 */
const handleHeartbeat = async (req: any, res: any) => {
  try {
    const { token } = req.params
    const monitor = await monitorRepository.findByToken(token)

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' })
    }

    // Determine heartbeat data
    let type: 'SUCCESS' | 'FAILURE' = 'SUCCESS'
    let duration: number | undefined
    let exitCode: number | undefined
    let output: string | undefined
    let latency: number | undefined
    let handshakeAge: number | undefined

    if (req.method === 'POST') {
      type = req.body.type === 'FAILURE' ? 'FAILURE' : 'SUCCESS'
      duration = req.body.duration
      exitCode = req.body.exitCode
      output = req.body.output
      latency = req.body.latency
      handshakeAge = req.body.handshakeAge
    }

    const now = new Date()
    const isLate = monitor.nextExpectedAt && now > monitor.nextExpectedAt

    // 1. Record heartbeat and update status
    await heartbeatRepository.record({
      monitorId: monitor.id,
      type,
      duration,
      exitCode,
      output,
      latency,
      handshakeAge,
      isLate: !!isLate,
    })

    // 2. Incident Management
    if (type === 'SUCCESS') {
      await incidentService.autoResolve(monitor.id)
    } else {
      await incidentService.createIncident(monitor.id, 'failed')
    }

    if (isLate && type === 'SUCCESS') {
      // If it's successful but late, we might still want an incident if it wasn't already created
      // But usually "late" is handled by the worker if it misses the window.
      // If it arrives late but successful, we can record it.
      await incidentService.createIncident(monitor.id, 'late')
    }

    // 3. Calculate and update next expected date
    const nextExpectedAt = getNextExpectedDate(
      monitor.schedule,
      monitor.scheduleType,
      monitor.timezone
    )

    await monitorRepository.update(monitor.id, monitor.projectId, {
       // @ts-ignore
      nextExpectedAt
    })

    res.json({ status: 'ok', nextExpectedAt })

    // Async: update health score and run pattern detection (non-blocking)
    setImmediate(() => {
      healthScoreService.calculateAndUpdate(monitor.id).catch(err => {
        console.error('[Heartbeat] Health score update failed:', err);
      })
      patternDetectionService.analyzeMonitor(monitor.id).catch(err => {
        console.error('[Heartbeat] Pattern detection failed:', err);
      })
    })
  } catch (error: any) {
    const errorMsg = `[${new Date().toISOString()}] CRITICAL: Heartbeat ingestion error: ${error.message}\n${error.stack}\n`;
    try {
      import('fs').then(fs => fs.appendFileSync('error_log.txt', errorMsg));
    } catch (e) {}
    console.error('CRITICAL: Heartbeat ingestion error:', error.message);
    console.error(error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

// Ingestion endpoints
// We use a broader path if needed, but here we expect /hb/:token
router.get('/:token', heartbeatRateLimiter, handleHeartbeat)
router.post('/:token', heartbeatRateLimiter, handleHeartbeat)

export default router
