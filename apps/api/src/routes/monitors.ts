import { Router, Request, Response } from 'express'
import { prisma } from '@stillup/db'
import { apiKeyOrAuthMiddleware } from '../middleware/auth.js'
import { managementLimiter } from '../middleware/rateLimit.js'
import {
  createMonitorSchema,
  updateMonitorSchema,
} from '../validators/monitor.js'
import { generateHeartbeatToken } from '../utils/token.js'
import { calculateMonitorStatus } from '../utils/status.js'
import { z } from 'zod'

const router = Router()

// All routes require authentication (JWT cookie or API key)
router.use(apiKeyOrAuthMiddleware)

// Apply rate limiting (100 requests/min per user)
router.use(managementLimiter)

/**
 * Helper function to convert interval in minutes to cron-like schedule string
 */
function intervalToCronSchedule(minutes: number): string {
  if (minutes < 60) {
    return `*/${minutes} * * * *` // Every X minutes
  } else if (minutes === 60) {
    return '0 * * * *' // Every hour
  } else if (minutes % 1440 === 0) {
    const days = minutes / 1440
    if (days === 1) {
      return '0 0 * * *' // Daily at midnight
    } else {
      return `0 0 */${days} * *` // Every X days
    }
  } else if (minutes % 60 === 0) {
    const hours = minutes / 60
    return `0 */${hours} * * *` // Every X hours
  } else {
    return `*/${minutes} * * * *` // Default to minutes
  }
}

/**
 * POST /api/monitors
 * Create a new monitor
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Validate input
    const validatedData = createMonitorSchema.parse(req.body)

    // Get user's organization (first one for now)
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id },
      include: { organization: true },
    })

    if (!membership) {
      res.status(400).json({ error: 'User is not part of any organization' })
      return
    }

    // Generate unique heartbeat token
    const heartbeatToken = await generateHeartbeatToken()

    // Convert interval to cron schedule
    const schedule = intervalToCronSchedule(validatedData.intervalMinutes)

    // Convert grace period from minutes to seconds
    const graceSeconds = validatedData.gracePeriodMinutes * 60

    // Create monitor
    const monitor = await prisma.monitor.create({
      data: {
        name: validatedData.name,
        schedule,
        scheduleType: 'interval',
        graceSeconds,
        heartbeatToken,
        organizationId: membership.organizationId,
        status: 'UP',
      },
    })

    // Calculate status (new monitors will always be UP initially)
    const calculatedStatus = calculateMonitorStatus(monitor)

    res.status(201).json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
        intervalMinutes: validatedData.intervalMinutes,
        gracePeriodMinutes: validatedData.gracePeriodMinutes,
        heartbeatToken: monitor.heartbeatToken,
        heartbeatUrl: `${process.env.API_URL || 'http://localhost:4000'}/api/ping/${monitor.heartbeatToken}`,
        status: monitor.status,
        calculatedStatus,
        lastHeartbeatAt: monitor.lastHeartbeatAt,
        nextExpectedAt: monitor.nextExpectedAt,
        createdAt: monitor.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      })
      return
    }

    console.error('Create monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/monitors
 * List all monitors for user's organization
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id },
      include: { organization: true },
    })

    if (!membership) {
      res.json({ monitors: [] })
      return
    }

    // Fetch monitors for organization (exclude soft-deleted)
    const monitors = await prisma.monitor.findMany({
      where: {
        organizationId: membership.organizationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            heartbeats: true,
            incidents: {
              where: { status: 'OPEN' },
            },
          },
        },
      },
    })

    // Convert schedule back to interval minutes for frontend
    const monitorsWithInterval = monitors.map((monitor) => {
      // Extract interval from schedule string
      let intervalMinutes = 60 // Default

      // Try to match different schedule patterns
      if (monitor.schedule.match(/\*\/(\d+) \* \* \* \*/)) {
        // Every X minutes: */X * * * *
        const match = monitor.schedule.match(/\*\/(\d+)/)
        if (match) intervalMinutes = parseInt(match[1])
      } else if (monitor.schedule.match(/0 \*\/(\d+) \* \* \*/)) {
        // Every X hours: 0 */X * * *
        const match = monitor.schedule.match(/0 \*\/(\d+)/)
        if (match) intervalMinutes = parseInt(match[1]) * 60
      } else if (monitor.schedule === '0 * * * *') {
        // Every hour
        intervalMinutes = 60
      } else if (monitor.schedule === '0 0 * * *') {
        // Daily
        intervalMinutes = 1440
      }

      // Calculate status dynamically
      const calculatedStatus = calculateMonitorStatus(monitor)

      return {
        id: monitor.id,
        name: monitor.name,
        intervalMinutes,
        gracePeriodMinutes: Math.floor(monitor.graceSeconds / 60),
        heartbeatToken: monitor.heartbeatToken,
        heartbeatUrl: `${process.env.API_URL || 'http://localhost:4000'}/api/ping/${monitor.heartbeatToken}`,
        status: monitor.status,
        calculatedStatus,
        lastHeartbeatAt: monitor.lastHeartbeatAt,
        nextExpectedAt: monitor.nextExpectedAt,
        createdAt: monitor.createdAt,
        totalHeartbeats: monitor._count.heartbeats,
        openIncidents: monitor._count.incidents,
      }
    })

    res.json({ monitors: monitorsWithInterval })
  } catch (error) {
    console.error('List monitors error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/monitors/:id
 * Get a single monitor by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id },
    })

    if (!membership) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    // Fetch monitor (must belong to user's organization)
    const monitor = await prisma.monitor.findFirst({
      where: {
        id,
        organizationId: membership.organizationId,
        deletedAt: null,
      },
      include: {
        heartbeats: {
          orderBy: { receivedAt: 'desc' },
          take: 10,
        },
        incidents: {
          where: { status: 'OPEN' },
          orderBy: { startedAt: 'desc' },
        },
      },
    })

    if (!monitor) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    // Extract interval from schedule
    let intervalMinutes = 60

    if (monitor.schedule.match(/\*\/(\d+) \* \* \* \*/)) {
      const match = monitor.schedule.match(/\*\/(\d+)/)
      if (match) intervalMinutes = parseInt(match[1])
    } else if (monitor.schedule.match(/0 \*\/(\d+) \* \* \*/)) {
      const match = monitor.schedule.match(/0 \*\/(\d+)/)
      if (match) intervalMinutes = parseInt(match[1]) * 60
    } else if (monitor.schedule === '0 * * * *') {
      intervalMinutes = 60
    } else if (monitor.schedule === '0 0 * * *') {
      intervalMinutes = 1440
    }

    // Calculate status dynamically
    const calculatedStatus = calculateMonitorStatus(monitor)

    res.json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
        intervalMinutes,
        gracePeriodMinutes: Math.floor(monitor.graceSeconds / 60),
        heartbeatToken: monitor.heartbeatToken,
        heartbeatUrl: `${process.env.API_URL || 'http://localhost:4000'}/api/ping/${monitor.heartbeatToken}`,
        status: monitor.status,
        calculatedStatus,
        lastHeartbeatAt: monitor.lastHeartbeatAt,
        nextExpectedAt: monitor.nextExpectedAt,
        createdAt: monitor.createdAt,
        recentHeartbeats: monitor.heartbeats,
        openIncidents: monitor.incidents,
      },
    })
  } catch (error) {
    console.error('Get monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PUT /api/monitors/:id
 * Update a monitor
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    // Validate input
    const validatedData = updateMonitorSchema.parse(req.body)

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id },
    })

    if (!membership) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    // Check if monitor exists and belongs to user's organization
    const existingMonitor = await prisma.monitor.findFirst({
      where: {
        id,
        organizationId: membership.organizationId,
        deletedAt: null,
      },
    })

    if (!existingMonitor) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    // Build update data
    const updateData: any = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    if (validatedData.intervalMinutes !== undefined) {
      updateData.schedule = intervalToCronSchedule(validatedData.intervalMinutes)
    }

    if (validatedData.gracePeriodMinutes !== undefined) {
      updateData.graceSeconds = validatedData.gracePeriodMinutes * 60
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }

    // Update monitor
    const monitor = await prisma.monitor.update({
      where: { id },
      data: updateData,
    })

    // Extract interval for response
    let intervalMinutes = 60

    if (monitor.schedule.match(/\*\/(\d+) \* \* \* \*/)) {
      const match = monitor.schedule.match(/\*\/(\d+)/)
      if (match) intervalMinutes = parseInt(match[1])
    } else if (monitor.schedule.match(/0 \*\/(\d+) \* \* \*/)) {
      const match = monitor.schedule.match(/0 \*\/(\d+)/)
      if (match) intervalMinutes = parseInt(match[1]) * 60
    } else if (monitor.schedule === '0 * * * *') {
      intervalMinutes = 60
    } else if (monitor.schedule === '0 0 * * *') {
      intervalMinutes = 1440
    }

    // Calculate status dynamically
    const calculatedStatus = calculateMonitorStatus(monitor)

    res.json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
        intervalMinutes,
        gracePeriodMinutes: Math.floor(monitor.graceSeconds / 60),
        heartbeatToken: monitor.heartbeatToken,
        heartbeatUrl: `${process.env.API_URL || 'http://localhost:4000'}/api/ping/${monitor.heartbeatToken}`,
        status: monitor.status,
        calculatedStatus,
        lastHeartbeatAt: monitor.lastHeartbeatAt,
        nextExpectedAt: monitor.nextExpectedAt,
        updatedAt: monitor.updatedAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      })
      return
    }

    console.error('Update monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * DELETE /api/monitors/:id
 * Soft delete a monitor
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: req.user.id },
    })

    if (!membership) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    // Check if monitor exists and belongs to user's organization
    const existingMonitor = await prisma.monitor.findFirst({
      where: {
        id,
        organizationId: membership.organizationId,
        deletedAt: null,
      },
    })

    if (!existingMonitor) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    // Soft delete (set deletedAt timestamp)
    await prisma.monitor.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    res.json({ message: 'Monitor deleted successfully' })
  } catch (error) {
    console.error('Delete monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
