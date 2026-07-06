import { Router } from "express";
import {
  apiKeyMiddleware,
  unifiedAuth,
  projectAccessMiddleware,
} from "../middleware/auth.js";
import { GuardsService } from "../services/GuardsService.js";
import { signToken, verifyToken } from "../utils/encryption.js";
import { prisma } from "@replaysafe/db";
import { auditService } from "../services/AuditService.js";

const router = Router();

/**
 * Validate a session token (executionId + HMAC signature).
 * Returns true if valid, false if not provided or invalid.
 */
function isValidToken(executionId: string, token?: string): boolean {
  if (!token) return true; // token is optional — callers that don't send it are trusted via API key
  const [id, sig] = token.split('.');
  return id === executionId && verifyToken(id, sig);
}

// =============================================================================
// Session management
// =============================================================================

/**
 * Initialize a ReplayGuard session
 * POST /api/guards/session
 *
 * Phase 6: now accepts workflowId and agentId for ledger grouping.
 */
router.post("/session", apiKeyMiddleware, async (req, res) => {
  try {
    const { monitorId, externalId, workflowId, agentId } = req.body;

    if (!monitorId) {
      return res.status(400).json({ error: "monitorId is required" });
    }

    const { project } = req;
    if (!project) return res.status(401).json({ error: "Unauthorized" });

    const execution = await GuardsService.createSession(
      monitorId,
      project.id,
      externalId,
      workflowId,
      agentId
    );
    const signature = signToken(execution.id);

    auditService.log({
      projectId: project.id,
      action: 'GUARD_SESSION_CREATE',
      resourceType: 'GUARD_EXECUTION',
      resourceId: execution.id,
      metadata: { monitorId, externalId, attempt: execution.attempt, workflowId, agentId },
    }).catch(e => console.error('[Guards] Audit log failed:', e));

    res.json({
      executionId: execution.id,
      attempt: execution.attempt,
      token: `${execution.id}.${signature}`,
      retryPolicy: (execution as any).retryPolicy,
      workflowId: execution.workflowId ?? null,
      agentId: execution.agentId ?? null,
    });
  } catch (error: any) {
    console.error(
      "[Guards] Session initialization error:",
      error.message || error,
    );
    if (error.message && error.message.includes("Circuit Breaker Tripped")) {
      return res
        .status(429)
        .json({ error: error.message, code: "CIRCUIT_BREAKER_TRIPPED" });
    }
    res.status(500).json({ error: "Failed to initialize session" });
  }
});

// =============================================================================
// Backward-compatible verify route (used by guard.wrap())
// DO NOT REMOVE OR CHANGE THE CONTRACT — existing SDK callers depend on this.
// =============================================================================

/**
 * Verify a side effect fingerprint (legacy path for guard.wrap())
 * POST /api/guards/verify
 */
router.post("/verify", apiKeyMiddleware, async (req, res) => {
  try {
    const {
      executionId,
      fingerprint,
      type,
      target,
      inputHash,
      token,
      metadata,
      scope,
    } = req.body;

    if (!executionId || !fingerprint) {
      return res
        .status(400)
        .json({ error: "executionId and fingerprint are required" });
    }

    if (!isValidToken(executionId, token)) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const result = await GuardsService.verifySideEffect(
      executionId,
      fingerprint,
      type || "GENERIC",
      target || "unknown",
      inputHash || "",
      metadata,
      scope,
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Guards] Verification error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to verify side effect", details: error.message });
  }
});

// =============================================================================
// Phase 6 — Execution Ledger routes (used by guard.effect())
// =============================================================================

/**
 * Begin a side effect — check dedup, write EXECUTING status
 * POST /api/guards/effect/begin
 */
router.post("/effect/begin", apiKeyMiddleware, async (req, res) => {
  try {
    const { executionId, fingerprint, type, target, inputHash, token, provider, workflowId, agentId } = req.body;

    if (!executionId || !fingerprint) {
      return res.status(400).json({ error: "executionId and fingerprint are required" });
    }

    if (!isValidToken(executionId, token)) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const result = await GuardsService.beginSideEffect(
      executionId,
      fingerprint,
      type || "GENERIC",
      target || "unknown",
      inputHash || "",
      provider,
      workflowId,
      agentId
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Guards] Effect begin error:", error.message);
    res.status(500).json({ error: "Failed to begin side effect", details: error.message });
  }
});

/**
 * Commit a side effect — transition EXECUTING → COMMITTED, store result + receipt
 * POST /api/guards/effect/commit
 */
router.post("/effect/commit", apiKeyMiddleware, async (req, res) => {
  try {
    const { executionId, fingerprint, token, result, receipt } = req.body;

    if (!executionId || !fingerprint) {
      return res.status(400).json({ error: "executionId and fingerprint are required" });
    }

    if (!isValidToken(executionId, token)) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    await GuardsService.commitSideEffect(executionId, fingerprint, result, receipt);

    res.json({ ok: true });
  } catch (error: any) {
    console.error("[Guards] Effect commit error:", error.message);
    res.status(500).json({ error: "Failed to commit side effect", details: error.message });
  }
});

/**
 * Mark a side effect UNKNOWN — transition EXECUTING → UNKNOWN
 * Called when the SDK operation times out with no confirmed response.
 * POST /api/guards/effect/unknown
 */
router.post("/effect/unknown", apiKeyMiddleware, async (req, res) => {
  try {
    const { executionId, fingerprint, token, reason } = req.body;

    if (!executionId || !fingerprint) {
      return res.status(400).json({ error: "executionId and fingerprint are required" });
    }

    if (!isValidToken(executionId, token)) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    await GuardsService.markUnknown(
      executionId,
      fingerprint,
      reason || "Timed out — outcome unknown"
    );

    res.json({ ok: true });
  } catch (error: any) {
    console.error("[Guards] Effect unknown error:", error.message);
    res.status(500).json({ error: "Failed to mark side effect unknown", details: error.message });
  }
});

// =============================================================================
// Rollback
// =============================================================================

/**
 * Register a rollback action
 * POST /api/guards/rollback/register
 */
router.post("/rollback/register", apiKeyMiddleware, async (req, res) => {
  try {
    const { executionId, fingerprint, token, rollback } = req.body;

    if (!executionId || !fingerprint || !rollback) {
      return res
        .status(400)
        .json({ error: "executionId, fingerprint, and rollback are required" });
    }

    if (!isValidToken(executionId, token)) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const result = await GuardsService.registerRollback(
      executionId,
      fingerprint,
      rollback.type,
      rollback.target,
      rollback.payload,
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Guards] Rollback registration error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to register rollback", details: error.message });
  }
});

/**
 * Complete a guarded execution
 * PATCH /api/guards/execution/:id
 *
 * Phase 6: now accepts "UNKNOWN" as a valid completion status
 * (used when the SDK times out before the session can be cleanly closed).
 */
router.patch("/execution/:id", apiKeyMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status, token, shouldRollback } = req.body;

    if (!status || !["SUCCESS", "FAILED", "UNKNOWN"].includes(status)) {
      return res.status(400).json({ error: "status must be SUCCESS, FAILED, or UNKNOWN" });
    }

    if (!isValidToken(id, token)) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    const result = await GuardsService.completeExecution(
      id,
      status,
      shouldRollback,
    );
    res.json(result);
  } catch (error) {
    console.error("[Guards] Completion error:", error);
    res.status(500).json({ error: "Failed to complete execution" });
  }
});

// =============================================================================
// Dashboard read routes
// =============================================================================

/**
 * List all side effects for a project (Dashboard)
 * GET /api/guards/side-effects
 */
router.get(
  "/side-effects",
  unifiedAuth,
  projectAccessMiddleware(),
  async (req: any, res: any) => {
    try {
      const projectId = req.project?.id || req.query.projectId;
      const { type } = req.query;

      const sideEffects = await prisma.guardSideEffect.findMany({
        where: {
          projectId,
          ...(type ? { type: type as string } : {}),
        },
        include: {
          execution: {
            include: {
              monitor: { select: { name: true } },
            },
          },
        },
        orderBy: { executedAt: "desc" },
        take: 100,
      });

      res.json(sideEffects);
    } catch (error: any) {
      console.error("[Guards] Side-effects list error:", error.message);
      res.status(500).json({ error: "Failed to fetch side effects" });
    }
  },
);

/**
 * Phase 6: List all side effects for a workflow ID (Dashboard + Phase 8 resume)
 * GET /api/guards/workflow/:workflowId
 */
router.get("/workflow/:workflowId", unifiedAuth, projectAccessMiddleware("MEMBER"), async (req: any, res: any) => {
  try {
    const { project } = req;
    if (!project) return res.status(401).json({ error: "Project context missing" });

    const effects = await GuardsService.listEffectsByWorkflow(
      req.params.workflowId as string,
      project.id
    );

    res.json(effects);
  } catch (error) {
    console.error("[Guards] Workflow effects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * List all guarded executions for the project (Dashboard)
 * GET /api/guards
 */
router.get(
  "/",
  unifiedAuth,
  projectAccessMiddleware("MEMBER"),
  async (req, res) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const executions = await GuardsService.listExecutions(project.id);
      res.json(executions);
    } catch (error) {
      console.error("[Guards] List error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * Get detailed execution info (Dashboard)
 * GET /api/guards/:id
 */
router.get(
  "/:id",
  unifiedAuth,
  projectAccessMiddleware("MEMBER"),
  async (req, res) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const execution = await GuardsService.getExecutionDetails(
        req.params.id as string,
        project.id,
      );
      if (!execution)
        return res.status(404).json({ error: "Execution not found" });

      res.json(execution);
    } catch (error) {
      console.error("[Guards] Detail error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
