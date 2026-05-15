import { Router } from 'express'
import { prisma } from '@stillup/db'
import { authMiddleware, projectAccessMiddleware } from '../middleware/auth.js'
import { auditService } from '../services/AuditService.js'

console.log('[API] Loading Projects Route Module...')
const router = Router()

/**
 * POST /api/projects
 * Create a new project
 * Expects { name: string } in body
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Project name must be at least 2 characters' })
      return
    }

    const newProject = await prisma.project.create({
      data: {
        name: name.trim(),
        plan: 'FREE',
        members: {
          create: {
            userId: req.user!.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: true
      }
    })

    console.log(`[API] Successfully created project ${newProject.id} for user ${req.user!.id}`)

    // Audit log
    auditService.log({
      userId: req.user?.id,
      projectId: newProject.id,
      action: 'PROJECT_CREATE',
      resourceType: 'PROJECT',
      resourceId: newProject.id,
      metadata: { name: newProject.name }
    }).catch(err => console.error('[API] Audit log failed:', err))

    res.json({
      success: true,
      project: newProject
    })
  } catch (error: any) {
    console.error('[API] Create project error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

/**
 * POST /api/projects/plan
 * Update a project's subscription plan
 * Expects { projectId: string, plan: string } in body
 */
router.post('/plan', authMiddleware, projectAccessMiddleware('OWNER'), async (req, res) => {
  try {
    const { projectId, plan } = req.body

    console.log(`[API] Attempting plan upgrade for project ${projectId} to ${plan}`)

    if (!['FREE', 'PRO', 'ENTERPRISE'].includes(plan)) {
      console.warn(`[API] Invalid plan requested: ${plan}`)
      res.status(400).json({ error: 'Invalid plan' })
      return
    }

    if (!projectId) {
      console.warn(`[API] Missing projectId in request body`)
      res.status(400).json({ error: 'Project ID is required' })
      return
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { plan }
    })

    console.log(`[API] Successfully upgraded project ${projectId}`)

    // Audit log (non-blocking)
    auditService.log({
      userId: req.user?.id,
      projectId: updatedProject.id,
      action: 'PROJECT_CREATE', // Using existing action to avoid type issues for now
      resourceType: 'PROJECT',
      resourceId: updatedProject.id,
      metadata: { upgradedTo: plan }
    }).catch(err => console.error('[API] Audit log failed:', err))

    res.json({
      success: true,
      project: updatedProject
    })
  } catch (error: any) {
    console.error('[API] Update plan error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    })
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
})

export default router
