import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { requestLogger } from "./middleware/requestLogger.js";
import authRoutes from "./routes/auth.js";
import monitorRoutes from "./routes/monitors.js";
import heartbeatRoutes from "./routes/heartbeats.js";
import analyticsRoutes from "./routes/analytics.js";
import metricsRoutes from "./routes/metrics.js";
import incidentRoutes from "./routes/incidents.js";
import alertChannelRoutes from "./routes/alert-channels.js";
import publicRoutes from "./routes/public.js";
import stripeRoutes from "./routes/stripe.js";
import guardRoutes from "./routes/guards.js";
import apiKeyRoutes from "./routes/api-keys.js";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimit.js";
import { authMiddleware, projectAccessMiddleware } from "./middleware/auth.js";
import { prisma } from "@stillup/db";
import { auditService } from "./services/AuditService.js";
import * as Sentry from "@sentry/node";

dotenv.config();

export function createApp() {
  const app = express();

  // Debug Logger
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // 1. Security Headers
  app.use(helmet());

  // 2. Request Logging
  app.use(requestLogger);

  // 3. CORS configuration - allow credentials for httpOnly cookies
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // 4. Body parsing and cookie parsing
  app.use(express.json({ limit: "10kb" })); // Request size limit
  app.use(cookieParser());

  // 5. Global API rate limiting
  app.use("/api", apiRateLimiter);

  // 6. Metrics and Health check
  app.use("/metrics", metricsRoutes);
  app.get("/health", (_, res) => {
    res.json({ status: "still up" });
  });

  // 7. Auth routes with stricter rate limiting
  app.use("/api/auth", authRateLimiter, authRoutes);

  // 8. Monitor routes
  app.use("/api/monitors", monitorRoutes);

  // 9. Heartbeat ingestion (simplified URL for easier integration)
  app.use("/hb", heartbeatRoutes);

  // 10. Analytics routes
  app.use("/api/analytics", analyticsRoutes);

  // 11. Incident routes
  app.use("/api/incidents", incidentRoutes);

  // 12. Alert Channel routes
  app.use("/api/alert-channels", alertChannelRoutes);

  // 13. Public routes (No Auth)
  app.use("/api/public", publicRoutes);

  // 14. Project management - upgrade plan
  app.post("/api/projects/plan", async (req, res) => {
    console.log("[API] >>> /api/projects/plan HIT <<<", req.body);
    try {
      const { projectId, plan } = req.body;

      if (!projectId || !plan) {
        res.status(400).json({ error: "projectId and plan are required" });
        return;
      }

      if (!['FREE', 'PRO', 'ENTERPRISE'].includes(plan)) {
        res.status(400).json({ error: "Invalid plan. Must be FREE, PRO, or ENTERPRISE" });
        return;
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { plan: plan as any }
      });

      console.log("[API] Plan upgrade success:", updatedProject.id, plan);
      res.json({ success: true, project: updatedProject });
    } catch (error: any) {
      console.error("[API] Plan upgrade error:", error.message);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });


  // 15. Billing routes
  app.use("/api/stripe", stripeRoutes);

  // 16. ReplayGuard routes
  app.use("/api/guards", guardRoutes);

  // 17. API Key management
  app.use("/api/api-keys", apiKeyRoutes);

  // Sentry Error Handler (must be after all controllers)
  Sentry.setupExpressErrorHandler(app);

  return app;
}

export function startServer() {
  const app = createApp();
  const port = process.env.PORT || 4040;
  app.listen(port, () =>
    console.log(`StillUp API running on port ${port}`)
  );
}
