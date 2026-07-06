import { Router, Request, Response } from "express";
import { prisma } from "@replaysafe/db";

const router = Router();

/**
 * GET /api/public/status/:slug
 * Returns public health data for a project
 */
router.get("/status/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const project = await (prisma as any).project.findUnique({
      where: { publicSlug: slug, isPublic: true },
      select: {
        id: true,
        name: true,
        monitors: {
          where: { publicVisibility: true, deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            healthScore: true,
            lastHeartbeatAt: true,
            incidents: {
              where: { resolvedAt: null },
              take: 5,
              orderBy: { startedAt: "desc" },
            },
          },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: "Status page not found" });
      return;
    }

    // Calculate Phase 5 Metrics
    const [totalEffects, skippedEffects, totalRollbacks, successRollbacks] =
      await Promise.all([
        (prisma as any).guardSideEffect.count({
          where: { projectId: project.id },
        }),
        (prisma as any).guardSideEffect.count({
          where: { projectId: project.id, status: "SKIPPED" },
        }),
        (prisma as any).guardRollback.count({
          where: { execution: { monitor: { projectId: project.id } } },
        }),
        (prisma as any).guardRollback.count({
          where: {
            execution: { monitor: { projectId: project.id } },
            status: "COMPLETED",
          },
        }),
      ]);

    const retrySafety =
      totalEffects > 0
        ? Math.round((skippedEffects / totalEffects) * 100)
        : 100;

    const rollbackHealth =
      totalRollbacks > 0
        ? Math.round((successRollbacks / totalRollbacks) * 100)
        : 100;

    // Fetch regional status for each monitor (Phase 5)
    const monitorsWithRegionalStatus = await Promise.all(
      project.monitors.map(async (m: any) => {
        const regionalHeartbeats = await (prisma as any).heartbeat.findMany({
          where: { monitorId: m.id },
          distinct: ["region"],
          orderBy: { receivedAt: "desc" },
          select: { region: true, type: true, latency: true, receivedAt: true },
        });

        return {
          ...m,
          regionalStatus: regionalHeartbeats.reduce((acc: any, curr: any) => {
            acc[curr.region || "DEFAULT"] = {
              status: curr.type === "SUCCESS" ? "UP" : "DOWN",
              latency: curr.latency,
              lastSeen: curr.receivedAt,
            };
            return acc;
          }, {}),
        };
      }),
    );

    res.json({
      ...project,
      monitors: monitorsWithRegionalStatus,
      stats: {
        retrySafety,
        rollbackHealth,
      },
    });
  } catch (error) {
    console.error("Public status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/public/interest
 * Handles interest submission for the Cloud Pro version
 */
router.post("/interest", async (req: Request, res: Response) => {
  try {
    const { email, name, source } = req.body;

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const interest = await (prisma as any).cloudInterest.create({
      data: {
        email,
        name,
        source: source || "pricing_page",
      },
    });

    res
      .status(201)
      .json({ message: "Interest recorded successfully", id: interest.id });
  } catch (error) {
    console.error("Interest submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
