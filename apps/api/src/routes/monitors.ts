import { Router } from 'express'
import { authMiddleware, projectAccessMiddleware, unifiedAuth } from '../middleware/auth.js'
import { createMonitorSchema, updateMonitorSchema } from '../validators/monitor.js'
import { monitorRepository } from '../repositories/MonitorRepository.js'
import { getNextExpectedDate } from '../utils/scheduleParser.js'
import { auditService } from '../services/AuditService.js'

const router = Router()

/**
 * POST /api/monitors
 * Create a new monitor
 */
router.post('/', unifiedAuth, projectAccessMiddleware('ADMIN'), async (req, res) => {
  try {
    // 1. Validate request body
    const validation = createMonitorSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      })
      return
    }

    const { project } = req
    if (!project) {
      res.status(401).json({ error: 'Project context missing' })
      return
    }

    // 2. Calculate initial next expected date
    const nextExpectedAt = getNextExpectedDate(
      validation.data.schedule,
      validation.data.scheduleType,
      validation.data.timezone
    )

    // 3. Create monitor (includes heartbeatToken in response)
    const monitor = await monitorRepository.create({
      ...validation.data,
      projectId: project.id,
    })

    // Update with nextExpectedAt
    await monitorRepository.update(monitor.id, project.id, {
        // @ts-ignore
        nextExpectedAt
    })

    // Re-fetch without token for audit, but keep the created record (with token) for response
    const monitorForAudit = { ...monitor }
    delete monitorForAudit.heartbeatToken

    // Log the action
    await auditService.logMonitorAction('MONITOR_CREATE', monitorForAudit, req.user?.id)

    res.status(201).json(monitor)
  } catch (error) {
    console.error('Create monitor error:', error)
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

/**
 * GET /api/monitors
 * List all monitors for the project
 */
router.get('/', unifiedAuth, projectAccessMiddleware('MEMBER'), async (req, res) => {
  try {
    const { project } = req
    if (!project) {
      res.status(401).json({ error: 'Project context missing' })
      return
    }

    const monitors = await monitorRepository.findAll(project.id)
    res.json(monitors)
  } catch (error) {
    console.error('List monitors error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/monitors/:id
 * Get a specific monitor
 */
router.get('/:id', unifiedAuth, projectAccessMiddleware('MEMBER'), async (req, res) => {
  try {
    const { project } = req
    if (!project) {
      res.status(401).json({ error: 'Project context missing' })
      return
    }

    const monitor = await monitorRepository.findById(req.params.id as string, project.id)
    if (!monitor) {
      res.status(404).json({ error: 'Monitor not found' })
      return
    }

    res.json(monitor)
  } catch (error) {
    console.error('Get monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PUT /api/monitors/:id
 * Update a monitor
 */
router.put('/:id', unifiedAuth, projectAccessMiddleware('ADMIN'), async (req, res) => {
  try {
    const validation = updateMonitorSchema.safeParse(req.body)
    if (!validation.success) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      })
      return
    }

    const { project } = req
    if (!project) {
      res.status(401).json({ error: 'Project context missing' })
      return
    }

    // Re-calculate nextExpectedAt if schedule changes
    let updateData = { ...validation.data }
    if (validation.data.schedule || validation.data.scheduleType) {
      const monitor = await monitorRepository.findById(req.params.id as string, project.id)
      if (monitor) {
        const schedule = validation.data.schedule || monitor.schedule
        const scheduleType = validation.data.scheduleType || monitor.scheduleType
        const timezone = validation.data.timezone || monitor.timezone
        
        // @ts-ignore
        updateData.nextExpectedAt = getNextExpectedDate(schedule, scheduleType, timezone)
      }
    }

    const monitor = await monitorRepository.update(req.params.id as string, project.id, updateData)
    if (!monitor) {
      res.status(404).json({ error: 'Monitor not found or unauthorized' })
      return
    }

    // Log the action
    await auditService.logMonitorAction('MONITOR_UPDATE', monitor, req.user?.id, { changes: Object.keys(updateData) })

    res.json(monitor)
  } catch (error) {
    console.error('Update monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * DELETE /api/monitors/:id
 * Soft-delete a monitor
 */
router.delete('/:id', unifiedAuth, projectAccessMiddleware('ADMIN'), async (req, res) => {
  try {
    const { project } = req
    if (!project) {
      res.status(401).json({ error: 'Project context missing' })
      return
    }

    const monitor = await monitorRepository.delete(req.params.id as string, project.id)
    if (!monitor) {
      res.status(404).json({ error: 'Monitor not found or unauthorized' })
      return
    }

    // Log the action
    await auditService.logMonitorAction('MONITOR_DELETE', monitor, req.user?.id)

    res.json({ message: 'Monitor deleted successfully' })
  } catch (error) {
    console.error('Delete monitor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
