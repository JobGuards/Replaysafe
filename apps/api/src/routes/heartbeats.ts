import { Router } from "express";
import { monitorRepository } from "../repositories/MonitorRepository.js";
import { heartbeatRepository } from "../repositories/HeartbeatRepository.js";
import { getNextExpectedDate } from "../utils/scheduleParser.js";
import { heartbeatRateLimiter } from "../middleware/rateLimit.js";
import { incidentService } from "../services/IncidentService.js";
import { healthScoreService } from "../services/HealthScoreService.js";
import { patternDetectionService } from "../services/PatternDetectionService.js";

const router = Router();

/**
 * Handle Heartbeat Ingestion
 * Supports both GET (simple) and POST (detailed)
 */
const handleHeartbeat = async (req: any, res: any) => {
  try {
    const { token } = req.params;
    const monitor = await monitorRepository.findByToken(token);

    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Determine heartbeat data
    let type: "SUCCESS" | "FAILURE" = "SUCCESS";
    let duration: number | undefined;
    let exitCode: number | undefined;
    let output: string | undefined;
    let latency: number | undefined;
    let handshakeAge: number | undefined;
    let region: string | undefined = req.query?.region as string;

    if (req.method === "POST") {
      type = req.body?.type === "FAILURE" ? "FAILURE" : "SUCCESS";
      duration = req.body?.duration;
      exitCode = req.body?.exitCode;
      output = req.body?.output;
      latency = req.body?.latency;
      handshakeAge = req.body?.handshakeAge;
      region = req.body?.region || region;

      // 📡 Ghost Connection Detection (for Secure Tunnel Telemetry)
      if (monitor.type === "TUNNEL" && handshakeAge !== undefined) {
        const threshold = (monitor.config as any)?.handshakeThreshold || 180; // Default to 3 mins
        if (handshakeAge > threshold) {
          type = "FAILURE";
          output = `Ghost Connection Detected: Handshake age is ${handshakeAge}s (Threshold: ${threshold}s). Tunnel is likely stale.`;
        }
      }
    }

    const now = new Date();
    const isLate = monitor.nextExpectedAt && now > monitor.nextExpectedAt;

    // 1. Record heartbeat and update status
    await heartbeatRepository.record({
      monitorId: monitor.id,
      type,
      duration,
      exitCode,
      output,
      latency,
      handshakeAge,
      isLate: !!isLate,
      region,
    });

    // 2. Incident Management
    if (type === "SUCCESS") {
      // For SUCCESS heartbeats: auto-resolve any open incidents.
      // If it's also late, the monitor was down but has recovered — no separate late incident needed.
      await incidentService.autoResolve(monitor.id);
    } else {
      await incidentService.createIncident(monitor.id, "failed");
    }

    // Late but successful heartbeats don't need a new incident — autoResolve already handled it.
    // The missed-heartbeat worker handles late detections independently.

    // 3. Calculate and update next expected date
    const nextExpectedAt = getNextExpectedDate(
      monitor.schedule,
      monitor.scheduleType,
      monitor.timezone,
    );

    await monitorRepository.update(monitor.id, monitor.projectId, {
      // @ts-ignore
      nextExpectedAt,
    });

    res.json({ status: "ok", nextExpectedAt });

    // Async: update health score and run pattern detection (non-blocking)
    setImmediate(() => {
      healthScoreService.calculateAndUpdate(monitor.id).catch((err) => {
        console.error("[Heartbeat] Health score update failed:", err);
      });
      patternDetectionService.analyzeMonitor(monitor.id).catch((err) => {
        console.error("[Heartbeat] Pattern detection failed:", err);
      });
    });
  } catch (error: any) {
    console.error("CRITICAL: Heartbeat ingestion error:", error.message);
    console.error(error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Ingestion endpoints
// We use a broader path if needed, but here we expect /hb/:token
router.get("/:token", heartbeatRateLimiter, handleHeartbeat);
router.post("/:token", heartbeatRateLimiter, handleHeartbeat);

export default router;
