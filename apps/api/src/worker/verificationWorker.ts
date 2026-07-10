import { prisma } from "@replaysafe/db";
import { VerificationService } from "../services/VerificationService.js";

/**
 * Phase 7 — Background Verification Worker
 *
 * Polls every 60 seconds (configurable via VERIFICATION_INTERVAL_MS).
 * For each project with UNKNOWN effects, runs a bounded verification pass (max 100 effects).
 *
 * Design decisions:
 * - Per-project sequential processing prevents one noisy tenant from starving others.
 * - 30s grace window (inside VerificationService.runProjectPass) avoids racing ahead
 *   of delayed COMMIT writes from the SDK.
 * - Rate limiting is enforced inside VerifierRegistry (20 calls/min/project/provider).
 */

let isRunning = false;

async function runVerificationPass(): Promise<void> {
  if (isRunning) {
    console.log("[VerificationWorker] Previous pass still running. Skipping.");
    return;
  }

  isRunning = true;

  try {
    // Find all projects that have at least one UNKNOWN effect older than 30s
    const cutoff = new Date(Date.now() - 30_000);

    const projectIds: { projectId: string }[] = await prisma.$queryRaw`
      SELECT DISTINCT gse."projectId"
      FROM "GuardSideEffect" gse
      WHERE gse.status = 'UNKNOWN'
        AND gse."finishedAt" < ${cutoff}
    `;

    if (projectIds.length === 0) return;

    console.log(
      `[VerificationWorker] Found ${projectIds.length} project(s) with UNKNOWN effects`,
    );

    for (const { projectId } of projectIds) {
      try {
        const result = await VerificationService.runProjectPass(projectId);

        if (result.total > 0) {
          console.log(
            `[VerificationWorker] project=${projectId} verified=${result.verified} failed=${result.failed} unknown=${result.unknown}`,
          );
        }
      } catch (err: any) {
        console.error(
          `[VerificationWorker] Error processing project ${projectId}: ${err.message}`,
        );
      }
    }
  } catch (err: any) {
    console.error(`[VerificationWorker] Pass error: ${err.message}`);
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the verification background worker.
 * @returns A cleanup function to stop the worker.
 */
export function startVerificationWorker(
  intervalMs = parseInt(process.env.VERIFICATION_INTERVAL_MS ?? "60000", 10),
): () => void {
  console.log(
    `[VerificationWorker] Starting (interval: ${intervalMs}ms, grace: 30s, rate limit: 20 calls/min/project/provider)`,
  );

  // Run once immediately on start to clear any UNKNOWN effects from a prior crash
  runVerificationPass();

  const interval = setInterval(runVerificationPass, intervalMs);
  return () => clearInterval(interval);
}
