import { Router, Request, Response } from 'express'
import { prisma } from '@stillup/db'
import { authMiddleware } from '../middleware/auth.js'
import { generateApiKey, hashApiKey, getKeyPrefix } from '../utils/apiKey.js'
import { createApiKeySchema } from '../validators/apiKey.js'
import { managementLimiter } from '../middleware/rateLimit.js'
import { z } from 'zod'

const router = Router()

// All routes require JWT auth (must be logged in to manage keys)
router.use(authMiddleware)

// Apply rate limiting (100 requests/min per user)
router.use(managementLimiter)

/**
 * POST /api/keys
 * Create a new API key — returns the plaintext key only once
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const validatedData = createApiKeySchema.parse(req.body)

    const plainKey = generateApiKey()
    const keyHash = hashApiKey(plainKey)
    const keyPrefix = getKeyPrefix(plainKey)

    const apiKey = await prisma.apiKey.create({
      data: {
        name: validatedData.name,
        keyHash,
        keyPrefix,
        userId: req.user.id,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    })

    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      key: plainKey, // Only returned once at creation
      keyPrefix,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors })
      return
    }
    console.error('Create API key error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/keys
 * List all API keys for the authenticated user (never returns full key)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ apiKeys })
  } catch (error) {
    console.error('List API keys error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * DELETE /api/keys/:id
 * Revoke (delete) an API key
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { id } = req.params

    // Ensure the key belongs to the authenticated user
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: req.user.id },
    })

    if (!apiKey) {
      res.status(404).json({ error: 'API key not found' })
      return
    }

    await prisma.apiKey.delete({ where: { id } })

    res.json({ message: 'API key revoked successfully' })
  } catch (error) {
    console.error('Delete API key error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
