import { prisma } from "@replaysafe/db";
import { alertService } from "./AlertService.js";
import { verifierRegistry } from "./verifiers/VerifierRegistry.js";
import { StripeVerifier } from "./verifiers/StripeVerifier.js";
import { SendGridVerifier } from "./verifiers/SendGridVerifier.js";
import { GitHubVerifier } from "./verifiers/GitHubVerifier.js";
import { SlackVerifier } from "./verifiers/SlackVerifier.js";
import { TwilioVerifier } from "./verifiers/TwilioVerifier.js";
import { S3Verifier } from "./verifiers/S3Verifier.js";
import type {
  LedgerEntry,
  VerificationResult,
} from "./verifiers/VerifierProvider.js";
import { decryptJSON } from "../utils/encryption.js";

// Self-register all built-in verifiers on module load.
// The registry is a singleton — import order doesn't matter.
verifierRegistry.register(new StripeVerifier());
verifierRegistry.register(new SendGridVerifier());
verifierRegistry.register(new GitHubVerifier());
verifierRegistry.register(new SlackVerifier());
verifierRegistry.register(new TwilioVerifier());
verifierRegistry.register(new S3Verifier());

export interface VerificationPassResult {
  verified: number;
  failed: number;
  unknown: number;
  total: number;
}

/**
 * Phase 7 — VerificationService
 *
 * Orchestrates verification passes against UNKNOWN side effects.
 * Used by both the background worker (project-wide sweep) and the
 * manual API trigger (single execution).
 */
export class VerificationService {
  /**
   * Runs a verification pass across all UNKNOWN effects for a specific project.
   *
   * @param projectId  - Scopes the pass to one tenant.
   * @param gracePeriodMs - Skip effects younger than this (default 30s).
   *                        Prevents racing ahead of delayed commits.
   */
  static async runProjectPass(
    projectId: string,
    gracePeriodMs = 30_000,
  ): Promise<VerificationPassResult> {
    const cutoff = new Date(Date.now() - gracePeriodMs);

    const unknownEffects = await prisma.guardSideEffect.findMany({
      where: {
        projectId,
        status: "UNKNOWN",
        finishedAt: { lt: cutoff },
      },
      take: 100, // Process in bounded batches — worker will re-run next cycle
    });

    if (unknownEffects.length === 0)
      return { verified: 0, failed: 0, unknown: 0, total: 0 };

    const providerConfigs =
      await VerificationService.loadProviderConfigs(projectId);

    return VerificationService.processEffects(
      unknownEffects,
      providerConfigs,
      projectId,
    );
  }

  /**
   * Runs a verification pass on all UNKNOWN effects for a single execution.
   * Called by the manual dashboard trigger.
   */
  static async runExecutionPass(
    executionId: string,
    projectId: string,
  ): Promise<VerificationPassResult> {
    // Verify the execution belongs to this project
    const execution = await prisma.guardExecution.findUnique({
      where: { id: executionId },
      include: { monitor: { select: { projectId: true } } },
    });

    if (!execution || execution.monitor.projectId !== projectId) {
      throw new Error("Execution not found or access denied");
    }

    const unknownEffects = await prisma.guardSideEffect.findMany({
      where: { executionId, status: "UNKNOWN" },
    });

    if (unknownEffects.length === 0)
      return { verified: 0, failed: 0, unknown: 0, total: 0 };

    const providerConfigs =
      await VerificationService.loadProviderConfigs(projectId);

    return VerificationService.processEffects(
      unknownEffects,
      providerConfigs,
      projectId,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────

  private static async processEffects(
    effects: any[],
    providerConfigs: Map<string, Record<string, any>>,
    projectId: string,
  ): Promise<VerificationPassResult> {
    const result: VerificationPassResult = {
      verified: 0,
      failed: 0,
      unknown: 0,
      total: effects.length,
    };

    for (const effect of effects) {
      const entry: LedgerEntry = {
        id: effect.id,
        type: effect.type,
        provider: effect.provider,
        receipt: effect.receipt as Record<string, any> | null,
        fingerprint: effect.fingerprint,
        target: effect.target,
        executionId: effect.executionId,
      };

      const providerConfig =
        providerConfigs.get((effect.provider ?? "").toLowerCase()) ?? {};

      const outcome: VerificationResult = await verifierRegistry.verify(
        entry,
        providerConfig,
        projectId,
      );

      await VerificationService.applyOutcome(effect, outcome, projectId);

      if (outcome.status === "VERIFIED") result.verified++;
      else if (outcome.status === "FAILED") result.failed++;
      else result.unknown++;
    }

    return result;
  }

  /**
   * Writes the verification outcome as an immutable ledger state transition.
   * When FAILED, triggers an alert to project notification channels.
   */
  private static async applyOutcome(
    effect: any,
    outcome: VerificationResult,
    projectId: string,
  ): Promise<void> {
    if (outcome.status === "UNKNOWN") return; // No transition — try again next cycle

    const newStatus = outcome.status === "VERIFIED" ? "VERIFIED" : "FAILED";

    await prisma.guardSideEffect.update({
      where: { id: effect.id },
      data: {
        status: newStatus,
        verifiedAt: new Date(),
        failureType:
          outcome.status === "FAILED" ? outcome.failureType || null : null,
        // Preserve existing metadata and append verification info
        metadata: {
          ...(typeof effect.metadata === "object" && effect.metadata !== null
            ? (effect.metadata as any)
            : {}),
          _verification: {
            resolvedAt: new Date().toISOString(),
            resolvedFrom: "UNKNOWN",
            resolvedTo: newStatus,
            failureType:
              outcome.status === "FAILED"
                ? outcome.failureType || null
                : undefined,
          },
        },
      },
    });

    console.log(
      `[VerificationService] Effect ${effect.id} (${effect.type}) → ${newStatus}`,
    );

    if (newStatus === "FAILED") {
      // Alert the project that a side effect has permanently failed
      const execution = await prisma.guardExecution.findUnique({
        where: { id: effect.executionId },
        include: { monitor: { select: { id: true, name: true } } },
      });

      if (execution) {
        await alertService
          .sendEmergencyAlert(
            projectId,
            execution.monitor.id,
            "SIDE_EFFECT_VERIFICATION_FAILED",
            `⚠️ Side Effect Permanently Failed\n\nOperation "${effect.type}" targeting "${effect.target}" on agent "${execution.monitor.name}" was marked UNKNOWN and has now been confirmed FAILED by provider verification.\n\nExecution ID: ${effect.executionId}\nEffect ID: ${effect.id}`,
          )
          .catch((err: any) =>
            console.error(
              `[VerificationService] Alert delivery failed: ${err.message}`,
            ),
          );
      }
    }
  }

  /**
   * Loads and decrypts all enabled provider configs for a project,
   * returning them as a map keyed by provider name (lowercase).
   */
  private static async loadProviderConfigs(
    projectId: string,
  ): Promise<Map<string, Record<string, any>>> {
    const configs = await (prisma as any).projectProviderConfig.findMany({
      where: { projectId, enabled: true },
    });

    const map = new Map<string, Record<string, any>>();
    for (const cfg of configs) {
      try {
        const decrypted =
          typeof cfg.config === "string" ? decryptJSON(cfg.config) : cfg.config;
        map.set(cfg.provider.toLowerCase(), decrypted);
      } catch (e) {
        console.warn(
          `[VerificationService] Failed to decrypt config for provider "${cfg.provider}"`,
        );
      }
    }
    return map;
  }
}
