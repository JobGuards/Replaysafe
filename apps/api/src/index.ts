import { startServer } from "./server.js";
import { startMissedHeartbeatWorker } from "./worker/missedHeartbeatWorker.js";

// Start background worker
startMissedHeartbeatWorker();

// Start API server
startServer();
