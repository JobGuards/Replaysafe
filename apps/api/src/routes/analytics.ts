import { Router } from 'express'
import { authMiddleware, projectAccessMiddleware } from '../middleware/auth.js'
import { prisma } from '@stillup/db'
import { subDays, startOfDay, subHours } from 'date-fns'
import { healthScoreService } from '../services/HealthScoreService.js'
import { patternDetectionService } from '../services/PatternDetectionService.js'

const router = Router()

/**
 * GET /api/analytics/:monitorId
 * Returns 30-day daily summaries, detected patterns, and current health score.
 */
router.get('/:monitorId', authMiddleware, async (req: any, res: any) => {
  try {
    const { monitorId } = req.params
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30)

    const [summaries, monitor, health, patterns] = await Promise.all([
      (prisma as any).executionSummary.findMany({
        where: { monitorId, period: 'daily', date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
      }),
      (prisma as any).monitor.findUnique({
        where: { id: monitorId },
        select: { name: true, status: true, projectId: true },
      }),
      healthScoreService.calculateScore(monitorId),
      patternDetectionService.detectPatterns(monitorId),
    ])

    res.json({ 
      summaries, 
      patterns, 
      health,
      monitorName: monitor?.name 
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/analytics/:monitorId/pulse
 * Returns last 24 hours of heartbeats for pulse grid visualization
 */
router.get('/:monitorId/pulse', authMiddleware, async (req: any, res: any) => {
  try {
    const { monitorId } = req.params
    const twentyFourHoursAgo = subHours(new Date(), 24)

    const pulses = await (prisma as any).heartbeat.findMany({
      where: {
        monitorId,
        receivedAt: { gte: twentyFourHoursAgo },
      },
      select: {
        status: true,
        receivedAt: true,
        latencyMs: true,
      },
      orderBy: { receivedAt: 'desc' },
      take: 288, // ~5 min intervals for 24h
    })

    res.json({ pulses })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/analytics/project/overview
 * Overall project-level analytics: all monitors, their health scores and summaries.
 */
router.get('/project/overview', authMiddleware, async (req: any, res: any) => {
  try {
    const { projectId } = req.query as { projectId: string }
    const sevenDaysAgo = subDays(new Date(), 7)

    const monitors = await (prisma as any).monitor.findMany({
      where: { projectId, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        healthScore: true,
        lastHeartbeatAt: true,
        executionSummaries: {
          where: { period: 'daily', date: { gte: sevenDaysAgo } },
          orderBy: { date: 'desc' },
          take: 7,
        },
        failurePatterns: {
          where: { active: true },
          select: { type: true, description: true, confidence: true },
        },
      },
    })

    res.json({ monitors })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/analytics/:monitorId/history
 * Returns incident history with resolution notes for Execution Memory (PR #42).
 */
router.get('/:monitorId/history', authMiddleware, async (req: any, res: any) => {
  try {
    const { monitorId } = req.params
    const incidents = await (prisma as any).incident.findMany({
      where: { monitorId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        group: { select: { id: true, title: true, patternType: true } },
      },
    })
    res.json({ incidents })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PATCH /api/analytics/incidents/:id/resolve
 * Update resolution notes and category on an incident (PR #44).
 */
router.patch('/incidents/:id/resolve', authMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { resolutionNotes, resolutionCategory } = req.body

    const updated = await (prisma as any).incident.update({
      where: { id },
      data: {
        resolutionNotes,
        resolutionCategory,
        resolvedAt: new Date(),
        autoResolved: false,
      },
    })

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/analytics/heartbeats
 * Returns the most recent 100 heartbeats across all monitors for the activity log.
 */
router.get('/heartbeats/recent', authMiddleware, async (req: any, res: any) => {
  try {
    const { projectId } = req.query as { projectId: string }

    const heartbeats = await (prisma as any).heartbeat.findMany({
      where: {
        monitor: {
          projectId,
          deletedAt: null,
        },
      },
      include: {
        monitor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: 100,
    })

    res.json({ heartbeats })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
