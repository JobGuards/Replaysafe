import { Router } from "express";
import { prisma } from "@replaysafe/db";
import { unifiedAuth, projectAccessMiddleware } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/incidents
 * List all incidents for the current project.
 */
router.get(
  "/",
  unifiedAuth,
  projectAccessMiddleware("MEMBER"),
  async (req: any, res: any) => {
    try {
      const projectId = req.project?.id;
      if (!projectId) {
        return res.status(401).json({ error: "Project context missing" });
      }

      const incidents = await (prisma as any).incident.findMany({
        where: {
          monitor: {
            projectId,
          },
        },
        include: {
          monitor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      });

      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/incidents/:id
 * Get a single incident by ID.
 */
router.get(
  "/:id",
  unifiedAuth,
  projectAccessMiddleware("MEMBER"),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      const incident = await (prisma as any).incident.findUnique({
        where: { id },
        include: {
          monitor: {
            select: {
              id: true,
              name: true,
              projectId: true,
            },
          },
          heartbeats: {
            take: 10,
            orderBy: { receivedAt: "desc" },
          },
        },
      });

      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const projectId = req.project?.id;
      if (incident.monitor.projectId !== projectId) {
        return res
          .status(403)
          .json({ error: "You do not have access to this incident" });
      }

      res.json(incident);
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
