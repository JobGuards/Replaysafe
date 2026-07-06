import { Router, Request, Response } from "express";
import { prisma } from "@replaysafe/db";
import { authMiddleware, projectAccessMiddleware } from "../middleware/auth.js";
import { encryptJSON, decryptJSON } from "../utils/encryption.js";
import { auditService } from "../services/AuditService.js";
import { alertService } from "../services/AlertService.js";
import { createAlertChannelSchema } from "../validators/alertChannel.js";
import { z } from "zod";

const router = Router();

/**
 * GET /api/alert-channels
 * List all alert channels for a project
 */
router.get(
  "/",
  authMiddleware,
  projectAccessMiddleware("MEMBER"),
  async (req, res) => {
    try {
      const { project } = req;
      const channels = await prisma.alertChannel.findMany({
        where: { projectId: project!.id },
      });

      // Decrypt configs before sending to UI; skip any that fail
      const decryptedChannels = channels.map((c) => {
        try {
          return { ...c, config: decryptJSON(c.config as string) };
        } catch {
          return { ...c, config: { error: "Failed to decrypt config" } };
        }
      });

      res.json(decryptedChannels);
    } catch (error) {
      console.error("List alert channels error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/alert-channels
 * Create a new alert channel
 */
router.post(
  "/",
  authMiddleware,
  projectAccessMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const { project } = req;

      const validation = createAlertChannelSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: "Validation failed",
          details: validation.error.format(),
        });
        return;
      }

      const { type, config, enabled } = validation.data;

      // Encrypt config at rest
      const encryptedConfig = encryptJSON(config);

      const channel = await prisma.alertChannel.create({
        data: {
          projectId: project!.id,
          type,
          config: encryptedConfig,
          enabled: enabled ?? true,
        },
      });

      await auditService.log({
        userId: req.user!.id,
        projectId: project!.id,
        action: "ALERT_CHANNEL_CREATE",
        resourceType: "ALERT_CHANNEL",
        resourceId: channel.id,
        metadata: { type },
      });

      res.status(201).json({
        ...channel,
        config: (() => {
          try {
            return decryptJSON(channel.config as string);
          } catch {
            return { error: "Failed to decrypt config" };
          }
        })(),
      });
    } catch (error) {
      console.error("Create alert channel error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/alert-channels/:id/test
 * Send a test notification
 */
router.post(
  "/:id/test",
  authMiddleware,
  projectAccessMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const { project } = req;
      const channel = await prisma.alertChannel.findUnique({
        where: { id: req.params.id as string, projectId: project!.id },
      });

      if (!channel) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }

      // Decrypt config
      const config = decryptJSON(channel.config as string);

      // Send test alert
      const provider = (alertService as any).providers[
        channel.type.toLowerCase()
      ];
      if (!provider) {
        res.status(400).json({
          error: `No provider found for channel type: ${channel.type}`,
        });
        return;
      }

      const mockMonitor = { name: "Test Monitor", id: "test-123" };
      const mockIncident = {
        id: "test-inc-123",
        monitorId: "test-123",
        startedAt: new Date(),
        type: "test",
      };

      await provider.sendAlert(config, {
        monitor: mockMonitor as any,
        incident: mockIncident as any,
        type: "creation",
        durationText: "This is a test notification.",
      });

      res.json({ message: "Test notification sent successfully" });
    } catch (error) {
      console.error("Test alert channel error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * DELETE /api/alert-channels/:id
 */
router.delete(
  "/:id",
  authMiddleware,
  projectAccessMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const { project } = req;

      // First, delete any Alert records associated with this channel
      await prisma.alert.deleteMany({
        where: { channelId: req.params.id as string },
      });

      await prisma.alertChannel.delete({
        where: { id: req.params.id as string, projectId: project!.id },
      });

      await auditService.log({
        userId: req.user!.id,
        projectId: project!.id,
        action: "ALERT_CHANNEL_DELETE",
        resourceType: "ALERT_CHANNEL",
        resourceId: req.params.id as string,
      });

      res.json({ message: "Channel deleted successfully" });
    } catch (error) {
      console.error("Delete alert channel error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
