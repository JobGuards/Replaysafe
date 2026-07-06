import { Router, Request, Response } from "express";
import { prisma } from "@replaysafe/db";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { signupSchema, signinSchema } from "../validators/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { auditService } from "../services/AuditService.js";
import { ProjectRole } from "@replaysafe/db";
import { z } from "zod";

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function checkLockout(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { failedAttempts: true, lockedUntil: true },
  });

  if (user && user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const remainingMin = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000,
    );
    throw new Error(
      `Account temporarily locked. Try again in ${remainingMin} minute(s).`,
    );
  }

  if (user && user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }
}

async function recordFailedAttempt(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, failedAttempts: true },
  });

  if (!user) return;

  const newAttempts = user.failedAttempts + 1;
  const lockedUntil =
    newAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: newAttempts,
      lockedUntil,
    },
  });
}

async function clearLockout(email: string): Promise<void> {
  await prisma.user.updateMany({
    where: { email: email.toLowerCase() },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
    },
  });
}

const router = Router();

/**
 * Helper function to create a slug from a name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user and project in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          name: validatedData.fullName,
        },
      });

      // Create primary project
      const projectName = `${validatedData.fullName}'s Project`;

      const project = await tx.project.create({
        data: {
          name: projectName,
        },
      });

      // Create membership (Owner)
      await (tx.projectMember as any).create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      });

      return { user, project };
    });

    // Log the signup
    await auditService.log({
      userId: result.user.id,
      projectId: result.project.id,
      action: "USER_SIGNUP",
      resourceType: "USER",
      resourceId: result.user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { method: "signup" },
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email!,
    });

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (without password)
    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.name,
        emailVerified: result.user.emailVerified,
      },
      project: {
        id: result.project.id,
        name: result.project.name,
        plan: result.project.plan,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: (error as any).errors,
      });
      return;
    }

    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/signin
 * Sign in with email and password
 */
router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = signinSchema.parse(req.body);

    // Check account lockout before any DB lookup
    try {
      await checkLockout(validatedData.email);
    } catch (err: any) {
      res.status(429).json({ error: err.message });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        projectMembers: {
          include: { project: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      await recordFailedAttempt(validatedData.email);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await recordFailedAttempt(validatedData.email);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Clear lockout on successful login
    await clearLockout(validatedData.email);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email!,
    });

    // Log the signin
    await auditService.log({
      userId: user.id,
      action: "USER_LOGIN",
      resourceType: "USER",
      resourceId: user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      metadata: { method: "password" },
    });

    // Set httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data with projects
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        emailVerified: user.emailVerified,
      },
      projects: user.projectMembers.map((m) => ({
        id: m.project.id,
        name: m.project.name,
        role: m.role,
        plan: m.project.plan,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: (error as any).errors,
      });
      return;
    }

    console.error("Signin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/signout
 * Sign out and clear session
 */
router.post(
  "/signout",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    if (req.user) {
      await auditService.log({
        userId: req.user.id,
        action: "USER_LOGOUT",
        resourceType: "USER",
        resourceId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }
    res.clearCookie("token");
    res.json({ message: "Signed out successfully" });
  },
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get(
  "/me",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      // Fetch user with projects via memberships
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          projectMembers: {
            include: { project: true },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.name,
          emailVerified: user.emailVerified,
        },
        projects: user.projectMembers.map((m) => ({
          id: m.project.id,
          name: m.project.name,
          role: m.role,
          plan: m.project.plan,
        })),
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
