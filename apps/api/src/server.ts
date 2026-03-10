import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import monitorRoutes from "./routes/monitors.js";
import heartbeatRoutes from "./routes/heartbeats.js";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimit.js";

dotenv.config();

export function createApp() {
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

  // Global API rate limiting
  app.use("/api", apiRateLimiter);

  // Health check endpoint
  app.get("/health", (_, res) => {
    res.json({ status: "still up" });
  });

  // Auth routes with stricter rate limiting
  app.use("/api/auth", authRateLimiter, authRoutes);

  // Monitor routes
  app.use("/api/monitors", monitorRoutes);

  // Heartbeat ingestion (simplified URL for easier integration)
  app.use("/hb", heartbeatRoutes);

  return app;
}

export function startServer() {
  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () =>
    console.log(`StillUp API running on port ${port}`)
  );
}
