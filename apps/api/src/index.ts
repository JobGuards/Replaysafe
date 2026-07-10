import { startServer } from "./server.js";
import { startMissedHeartbeatWorker } from "./worker/missedHeartbeatWorker.js";
import { scheduleAnalyticsWorker } from "./worker/analyticsWorker.js";
import { startVerificationWorker } from "./worker/verificationWorker.js";

// Start background workers
startMissedHeartbeatWorker();
scheduleAnalyticsWorker();
startVerificationWorker(); // Phase 7: resolves UNKNOWN side effects

// Start API server
startServer();
