import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import monitorRoutes from "./routes/monitors.js";
import { prisma } from '@stillup/db'
import { calculateNextExpectedAt } from './utils/status.js'

dotenv.config();

export function startServer() {
  const app = express();

  // CORS configuration - allow credentials for httpOnly cookies
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // Body parsing and cookie parsing
  app.use(express.json());
  app.use(cookieParser());

  // Health check endpoint
  app.get("/health", (_, res) => {
    res.json({ status: "still up" });
  });

  // PUBLIC ENDPOINT - Heartbeat ping (no authentication required)
  app.post('/api/ping/:heartbeatToken', async (req, res) => {
    const { heartbeatToken } = req.params

    try {
      // 1. Validate token format (basic check)
      if (!heartbeatToken || !heartbeatToken.startsWith('hb_')) {
        res.status(400).json({ error: 'Invalid heartbeat token format' })
        return
      }

      // 2. Find monitor by token (indexed query - very fast)
      const monitor = await prisma.monitor.findUnique({
        where: { heartbeatToken },
        select: {
          id: true,
          schedule: true,
          graceSeconds: true,
          status: true,
          deletedAt: true,
        },
      })

      // 3. Check if monitor exists and is not deleted
      if (!monitor || monitor.deletedAt) {
        res.status(404).json({ error: 'Monitor not found' })
        return
      }

      // 4. Calculate next expected time
      const now = new Date()
      const nextExpectedAt = calculateNextExpectedAt(monitor.schedule, now)

      // 5. Update monitor and create heartbeat in transaction
      await prisma.$transaction(async (tx) => {
        // Update monitor timestamps
        await tx.monitor.update({
          where: { id: monitor.id },
          data: {
            lastHeartbeatAt: now,
            nextExpectedAt: nextExpectedAt,
          },
        })

        // Create heartbeat record
        await tx.heartbeat.create({
          data: {
            monitorId: monitor.id,
            type: 'SUCCESS',
            receivedAt: now,
          },
        })

        // Auto-resolve any open incidents (monitor recovered)
        await tx.incident.updateMany({
          where: {
            monitorId: monitor.id,
            status: 'OPEN',
          },
          data: {
            status: 'RESOLVED',
            resolvedAt: now,
          },
        })
      })

      // 6. Return fast success response
      res.json({ status: 'ok', receivedAt: now.toISOString() })
    } catch (error) {
      console.error('[Ping endpoint error]:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Auth routes
  app.use("/api/auth", authRoutes);

  // Monitor routes (protected by auth middleware in routes file)
  app.use("/api/monitors", monitorRoutes);

  const port = process.env.PORT || 4000;
  app.listen(port, () =>
    console.log(`StillUp API running on port ${port}`)
  );
}
