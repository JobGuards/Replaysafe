import { Router } from "express";
import { unifiedAuth, projectAccessMiddleware } from "../middleware/auth.js";
import { prisma } from "@replaysafe/db";
import { encryptJSON, decryptJSON } from "../utils/encryption.js";

const router = Router();

const SUPPORTED_PROVIDERS = [
  "stripe",
  "sendgrid",
  "github",
  "slack",
  "twilio",
  "s3",
];

/**
 * List all provider configs for the project (config values are redacted).
 * GET /api/provider-configs
 */
router.get(
  "/",
  unifiedAuth,
  projectAccessMiddleware("MEMBER"),
  async (req: any, res: any) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const configs = await (prisma as any).projectProviderConfig.findMany({
        where: { projectId: project.id },
        select: {
          id: true,
          provider: true,
          enabled: true,
          createdAt: true,
          updatedAt: true,
          // config intentionally omitted — never return raw credentials
        },
        orderBy: { provider: "asc" },
      });

      res.json(configs);
    } catch (error: any) {
      console.error("[ProviderConfigs] List error:", error.message);
      res.status(500).json({ error: "Failed to list provider configs" });
    }
  },
);

/**
 * Create or update a provider config for the project.
 * POST /api/provider-configs
 * Body: { provider: "stripe", config: { secretKey: "sk_live_..." }, enabled?: boolean }
 */
router.post(
  "/",
  unifiedAuth,
  projectAccessMiddleware("ADMIN"),
  async (req: any, res: any) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const { provider, config, enabled = true } = req.body;

      if (!provider || !config) {
        return res
          .status(400)
          .json({ error: "provider and config are required" });
      }

      if (!SUPPORTED_PROVIDERS.includes(provider.toLowerCase())) {
        return res.status(400).json({
          error: `Unsupported provider. Supported: ${SUPPORTED_PROVIDERS.join(", ")}`,
        });
      }

      const encryptedConfig = encryptJSON(config);

      const result = await (prisma as any).projectProviderConfig.upsert({
        where: {
          projectId_provider: {
            projectId: project.id,
            provider: provider.toLowerCase(),
          },
        },
        create: {
          projectId: project.id,
          provider: provider.toLowerCase(),
          config: encryptedConfig,
          enabled,
        },
        update: {
          config: encryptedConfig,
          enabled,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          provider: true,
          enabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(result);
    } catch (error: any) {
      console.error("[ProviderConfigs] Upsert error:", error.message);
      res.status(500).json({ error: "Failed to save provider config" });
    }
  },
);

/**
 * Enable or disable a provider config.
 * PATCH /api/provider-configs/:id
 * Body: { enabled: boolean }
 */
router.patch(
  "/:id",
  unifiedAuth,
  projectAccessMiddleware("ADMIN"),
  async (req: any, res: any) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const { enabled } = req.body;
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }

      // Confirm config belongs to this project before updating
      const existing = await (prisma as any).projectProviderConfig.findUnique({
        where: { id: req.params.id },
      });

      if (!existing || existing.projectId !== project.id) {
        return res.status(404).json({ error: "Provider config not found" });
      }

      const result = await (prisma as any).projectProviderConfig.update({
        where: { id: req.params.id },
        data: { enabled, updatedAt: new Date() },
        select: {
          id: true,
          provider: true,
          enabled: true,
          updatedAt: true,
        },
      });

      res.json(result);
    } catch (error: any) {
      console.error("[ProviderConfigs] Patch error:", error.message);
      res.status(500).json({ error: "Failed to update provider config" });
    }
  },
);

/**
 * Delete a provider config.
 * DELETE /api/provider-configs/:id
 */
router.delete(
  "/:id",
  unifiedAuth,
  projectAccessMiddleware("ADMIN"),
  async (req: any, res: any) => {
    try {
      const { project } = req;
      if (!project)
        return res.status(401).json({ error: "Project context missing" });

      const existing = await (prisma as any).projectProviderConfig.findUnique({
        where: { id: req.params.id },
      });

      if (!existing || existing.projectId !== project.id) {
        return res.status(404).json({ error: "Provider config not found" });
      }

      await (prisma as any).projectProviderConfig.delete({
        where: { id: req.params.id },
      });

      res.json({ ok: true });
    } catch (error: any) {
      console.error("[ProviderConfigs] Delete error:", error.message);
      res.status(500).json({ error: "Failed to delete provider config" });
    }
  },
);

export default router;
