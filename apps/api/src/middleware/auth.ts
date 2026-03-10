import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { prisma } from '@stillup/db'

// Extend Express Request type to include user and project
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        fullName: string | null
      }
      project?: {
        id: string
      }
    }
  }
}

/**
 * JWT Authentication middleware
 * Verifies JWT token from httpOnly cookie and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from cookie
    const token = req.cookies?.token

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    // Verify token
    const payload = verifyToken(token)

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    })

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    // Attach user to request
    req.user = user

    next()
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message })
    } else {
      res.status(401).json({ error: 'Authentication failed' })
    }
  }
}

/**
 * Optional JWT authentication middleware
 * Attaches user to request if token is present, but doesn't fail if not
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token

    if (token) {
      const payload = verifyToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      })

      if (user) {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // Silently fail for optional auth
    next()
  }
}

/**
 * API Key Authentication middleware
 * Verifies key from X-API-Key header and attaches project to request
 */
export async function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key']

    if (!apiKey || typeof apiKey !== 'string') {
      res.status(401).json({ error: 'X-API-Key header is missing' })
      return
    }

    // Find the project associated with this API key
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      select: {
        projectId: true,
        id: true,
      },
    })

    if (!keyData) {
      res.status(403).json({ error: 'Invalid API Key' })
      return
    }

    // Attach project to request
    req.project = { id: keyData.projectId }

    // Update lastUsed timestamp asynchronously (no need to wait for it)
    prisma.apiKey
      .update({
        where: { id: keyData.id },
        data: { lastUsed: new Date() },
      })
      .catch((e) => console.error('Error updating api key lastUsed:', e))

    next()
  } catch (error) {
    console.error('API Key Auth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
