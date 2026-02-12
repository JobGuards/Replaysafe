import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

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

  // Auth routes
  app.use("/api/auth", authRoutes);

  const port = process.env.PORT || 4000;
  app.listen(port, () =>
    console.log(`StillUp API running on port ${port}`)
  );
}
