import { Router } from "express";
import { prisma } from "@replaysafe/db";
import { authMiddleware, projectAccessMiddleware } from "../middleware/auth.js";
import { randomBytes, createHash } from "node:crypto";

const router = Router();

/**
 * GET /api/api-keys
 * List all API keys for a project
 */
router.get(
  "/",
  authMiddleware,
  projectAccessMiddleware("MEMBER"),
  async (req: any, res: any) => {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { projectId: req.project.id },
        select: {
          id: true,
          name: true,
          key: true,
          lastUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Mask keys for security
      const maskedKeys = keys.map((k) => ({
        ...k,
        key: `rs_****`,
      }));

      res.json(maskedKeys);
    } catch (error) {
      console.error("List API keys error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/api-keys
 * Create a new API key
 */
router.post(
  "/",
  authMiddleware,
  projectAccessMiddleware("ADMIN"),
  async (req: any, res: any) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });

      // Generate a secure key
      // Prefix with 'rs_' for easy identification (Replaysafe)
      const key = `rs_${randomBytes(24).toString("hex")}`;
      const hashedKey = createHash("sha256").update(key).digest("hex");

      const apiKey = await prisma.apiKey.create({
        data: {
          projectId: req.project.id,
          name,
          key: hashedKey,
        },
      });

      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key,
        createdAt: apiKey.createdAt,
      });
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * DELETE /api/api-keys/:id
 * Revoke an API key
 */
router.delete(
  "/:id",
  authMiddleware,
  projectAccessMiddleware("ADMIN"),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;

      await prisma.apiKey.delete({
        where: {
          id,
          projectId: req.project.id, // Ensure it belongs to the project
        },
      });

      res.json({ message: "API key revoked" });
    } catch (error) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
