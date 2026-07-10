import { Router } from "express";
import { unifiedAuth, projectAccessMiddleware } from "../middleware/auth.js";
import { prisma } from "@replaysafe/db";

const router = Router();

/**
 * GET /api/agents/:agentId/effects
 * Returns everything an agent has done across all executions in the project.
 */
router.get(
  "/:agentId/effects",
  unifiedAuth,
  projectAccessMiddleware("MEMBER"),
  async (req: any, res: any) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const effects = await prisma.guardSideEffect.findMany({
        where: {
          agentId: req.params.agentId,
          projectId: project.id,
        },
        orderBy: { executedAt: "desc" },
        include: {
          execution: {
            select: {
              monitor: { select: { name: true } },
              startedAt: true,
              attempt: true,
            },
          },
        },
      });

      res.json(effects);
    } catch (error) {
      console.error("[Agents] Get effects error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
