import { Router } from "express";
import { apiKeyMiddleware, unifiedAuth, projectAccessMiddleware } from "../middleware/auth.js";
import { GuardsService } from "../services/GuardsService.js";
import { signToken, verifyToken } from "../utils/encryption.js";
import { prisma } from "@replaysafe/db";
import { auditService } from "../services/AuditService.js";

const router = Router();

/**
 * Initialize a ReplayGuard session
 * POST /api/guards/session
 */
router.post("/session", apiKeyMiddleware, async (req, res) => {
  try {
    const { monitorId, externalId } = req.body;
    
    if (!monitorId) {
      return res.status(400).json({ error: "monitorId is required" });
    }

    const { project } = req;
    if (!project) return res.status(401).json({ error: "Unauthorized" });

    const execution = await GuardsService.createSession(monitorId, project.id, externalId);
    const signature = signToken(execution.id);

    auditService.log({
      projectId: project.id,
      action: 'GUARD_SESSION_CREATE',
      resourceType: 'GUARD_EXECUTION',
      resourceId: execution.id,
      metadata: { monitorId, externalId, attempt: execution.attempt },
    }).catch(e => console.error('[Guards] Audit log failed:', e))

    res.json({
      executionId: execution.id,
      attempt: execution.attempt,
      token: `${execution.id}.${signature}`,
      retryPolicy: (execution as any).retryPolicy
    });
  } catch (error: any) {
    console.error("[Guards] Session initialization error:", error.message || error);
    if (error.message && error.message.includes("Circuit Breaker Tripped")) {
      return res.status(429).json({ error: error.message, code: "CIRCUIT_BREAKER_TRIPPED" });
    }
    res.status(500).json({ error: "Failed to initialize session" });
  }
});

/**
 * Verify a side effect fingerprint
 * POST /api/guards/verify
 */
router.post("/verify", apiKeyMiddleware, async (req, res) => {
  try {
    const { executionId, fingerprint, type, target, inputHash, token, metadata, scope } = req.body;

    if (!executionId || !fingerprint) {
      return res.status(400).json({ error: "executionId and fingerprint are required" });
    }

    // Verify session token if provided (strict security)
    if (token) {
      const [id, sig] = token.split('.');
      if (id !== executionId || !verifyToken(id, sig)) {
        return res.status(401).json({ error: "Invalid session token" });
      }
    }

    const result = await GuardsService.verifySideEffect(
      executionId,
      fingerprint,
      type || "GENERIC",
      target || "unknown",
      inputHash || "",
      metadata,
      scope
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Guards] Verification error:", error.message);
    res.status(500).json({ error: "Failed to verify side effect", details: error.message });
  }
});

/**
 * Register a rollback action
 * POST /api/guards/rollback/register
 */
router.post("/rollback/register", apiKeyMiddleware, async (req, res) => {
  try {
    const { executionId, fingerprint, token, rollback } = req.body;

    if (!executionId || !fingerprint || !rollback) {
      return res.status(400).json({ error: "executionId, fingerprint, and rollback are required" });
    }

    // Verify session token
    if (token) {
      const [id, sig] = token.split('.');
      if (id !== executionId || !verifyToken(id, sig)) {
        return res.status(401).json({ error: "Invalid session token" });
      }
    }

    const result = await GuardsService.registerRollback(
      executionId,
      fingerprint,
      rollback.type,
      rollback.target,
      rollback.payload
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Guards] Rollback registration error:", error.message);
    res.status(500).json({ error: "Failed to register rollback", details: error.message });
  }
});

/**
 * Complete a guarded execution
 * PATCH /api/guards/execution/:id
 */
router.patch("/execution/:id", apiKeyMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status, token, shouldRollback } = req.body;

    if (!status || !["SUCCESS", "FAILED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Verify session token if provided
    if (token) {
      const [tokenId, sig] = token.split('.');
      if (tokenId !== id || !verifyToken(tokenId, sig)) {
        return res.status(401).json({ error: "Invalid session token" });
      }
    }

    const result = await GuardsService.completeExecution(id, status, shouldRollback);
    res.json(result);
  } catch (error) {
    console.error("[Guards] Completion error:", error);
    res.status(500).json({ error: "Failed to complete execution" });
  }
});

/**
 * List all side effects for a project (Dashboard)
 * GET /api/guards/side-effects
 */
router.get("/side-effects", unifiedAuth, projectAccessMiddleware(), async (req: any, res: any) => {
  try {
    const projectId = req.project?.id || req.query.projectId;
    const { type } = req.query;

    const sideEffects = await (prisma as any).guardSideEffect.findMany({
      where: {
        projectId,
        ...(type ? { type: type as string } : {})
      },
      include: {
        execution: {
          include: {
            monitor: { select: { name: true } }
          }
        }
      },
      orderBy: { executedAt: "desc" },
      take: 100
    });

    res.json(sideEffects);
  } catch (error: any) {
    console.error("[Guards] Side-effects list error:", error.message);
    res.status(500).json({ error: "Failed to fetch side effects" });
  }
});

/**
 * List all guarded executions for the project (Dashboard)
 * GET /api/guards
 */
router.get("/", unifiedAuth, projectAccessMiddleware("MEMBER"), async (req, res) => {
  try {
    const { project } = req;
    if (!project) return res.status(401).json({ error: "Project context missing" });

    const executions = await GuardsService.listExecutions(project.id);
    res.json(executions);
  } catch (error) {
    console.error("[Guards] List error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get detailed execution info (Dashboard)
 * GET /api/guards/:id
 */
router.get("/:id", unifiedAuth, projectAccessMiddleware("MEMBER"), async (req, res) => {
  try {
    const { project } = req;
    if (!project) return res.status(401).json({ error: "Project context missing" });

    const execution = await GuardsService.getExecutionDetails(req.params.id as string, project.id);
    if (!execution) return res.status(404).json({ error: "Execution not found" });

    res.json(execution);
  } catch (error) {
    console.error("[Guards] Detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
