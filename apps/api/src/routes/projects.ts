import { Router } from 'express'
import { prisma } from '@stillup/db'
import { authMiddleware, projectAccessMiddleware } from '../middleware/auth.js'
import { auditService } from '../services/AuditService.js'

console.log('[API] Loading Projects Route Module...')
const router = Router()

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
