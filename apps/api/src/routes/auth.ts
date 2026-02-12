import { Router, Request, Response } from 'express'
import { prisma } from '@stillup/db'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateToken } from '../utils/jwt.js'
import { signupSchema, signinSchema } from '../validators/auth.js'
import { authMiddleware } from '../middleware/auth.js'
import { z } from 'zod'

const router = Router()

/**
 * Helper function to create a slug from a name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = signupSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' })
      return
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          fullName: validatedData.fullName,
        },
      })

      // Create personal organization
      const orgName = `${validatedData.fullName}'s Organization`
      const orgSlug = createSlug(orgName) + '-' + user.id.substring(0, 8)

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      })

      return { user, organization }
    })

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
    })

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Return user data (without password)
    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        emailVerified: result.user.emailVerified,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
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

    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/auth/signin
 * Sign in with email and password
 */
router.post('/signin', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = signinSchema.parse(req.body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Compare password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.passwordHash
    )

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    // Return user data with organizations
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
      },
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      })
      return
    }

    console.error('Signin error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/auth/signout
 * Sign out and clear session
 */
router.post('/signout', (req: Request, res: Response): void => {
  res.clearCookie('token')
  res.json({ message: 'Signed out successfully' })
})

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' })
        return
      }

      // Fetch user with organizations
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      })

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
        },
        organizations: user.memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.role,
        })),
      })
    } catch (error) {
      console.error('Get user error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
