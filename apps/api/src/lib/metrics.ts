import { Registry, Counter, Histogram } from "prom-client";

export const register = new Registry();

// Default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from "prom-client";
collectDefaultMetrics({ register });

// Custom Metrics: HTTP Requests
export const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests processed",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Histogram of HTTP request durations",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // seconds
  registers: [register],
});

// Heartbeat Specific Metrics
export const heartbeatsReceivedCounter = new Counter({
  name: "heartbeats_received_total",
  help: "Total number of heartbeats received by the ingestion endpoint",
  labelNames: ["monitor_id", "type", "is_late"],
  registers: [register],
});

// Incident Metrics
export const incidentsCreatedCounter = new Counter({
  name: "incidents_created_total",
  help: "Total number of incidents created",
  labelNames: ["monitor_id", "type"],
  registers: [register],
});

// Worker Performance
export const workerExecutionDuration = new Histogram({
  name: "worker_execution_duration_seconds",
  help: "Histogram of worker execution durations",
  labelNames: ["worker_name"],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600], // seconds
  registers: [register],
});
