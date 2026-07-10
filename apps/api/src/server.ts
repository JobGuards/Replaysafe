import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
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
import projectRoutes from "./routes/projects.js";
import providerConfigRoutes from "./routes/provider-configs.js";
import agentRoutes from "./routes/agents.js";
import {
  apiRateLimiter,
  authRateLimiter,
  heartbeatRateLimiter,
} from "./middleware/rateLimit.js";
import { authMiddleware, projectAccessMiddleware } from "./middleware/auth.js";
import { prisma } from "@replaysafe/db";
import { auditService } from "./services/AuditService.js";
import * as Sentry from "@sentry/node";
import { initSentry } from "./lib/sentry.js";

// Load .env from monorepo root regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __rootDir = resolve(dirname(__filename), "../../..");
dotenv.config({ path: resolve(__rootDir, ".env") });

export function createApp() {
  initSentry();
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // 2. Request Logging
  app.use(requestLogger);

  // 3. CORS configuration - allow credentials for httpOnly cookies
  // Supports multiple origins: dashboard + landing page (separate deployments)
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.LANDING_URL || "http://localhost:3001",
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      },
      credentials: true,
    }),
  );

  // 4. Raw body capture for Stripe webhook signature verification (must be before JSON parser)
  app.use(
    "/api/stripe/webhook",
    express.raw({ type: "application/json", limit: "10kb" }),
    (req, _res, next) => {
      (req as any).rawBody = req.body;
      next();
    },
  );

  // 5. Body parsing and cookie parsing
  app.use(express.json({ limit: "10kb" })); // Request size limit
  app.use(cookieParser());

  // 6. Global API rate limiting
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
  app.use("/hb", heartbeatRateLimiter, heartbeatRoutes);

  // 10. Analytics routes
  app.use("/api/analytics", analyticsRoutes);

  // 11. Incident routes
  app.use("/api/incidents", incidentRoutes);

  // 12. Alert Channel routes
  app.use("/api/alert-channels", alertChannelRoutes);

  // 13. Public routes (No Auth)
  app.use("/api/public", publicRoutes);

  // 14. Project management
  app.use("/api/projects", projectRoutes);

  // 15. Billing routes
  app.use("/api/stripe", stripeRoutes);

  // 16. ReplayGuard routes
  app.use("/api/guards", guardRoutes);

  // 17. API Key management
  app.use("/api/api-keys", apiKeyRoutes);

  // 18. Phase 7: Provider verification configs
  app.use("/api/provider-configs", providerConfigRoutes);

  // 19. Phase 9: Agent Execution Memory
  app.use("/api/agents", agentRoutes);

  // Sentry Error Handler (must be after all controllers)
  Sentry.setupExpressErrorHandler(app);

  return app;
}

export function startServer() {
  const app = createApp();
  const port = process.env.PORT || 4040;
  app.listen(port, () => console.log(`Replaysafe API running on port ${port}`));
}
