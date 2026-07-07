import {
  VerifierProvider,
  LedgerEntry,
  VerificationResult,
} from "./VerifierProvider.js";

/**
 * In-memory sliding-window rate limiter for verification calls.
 *
 * Phase 7 design decision: per-project, per-provider limit of 20 calls/minute.
 * This prevents Stripe/SendGrid API exhaustion during high-UNKNOWN-volume events.
 * Upgradeable to Redis in Phase 10 when cross-process coordination is needed.
 */
class VerificationRateLimiter {
  private windowMs = 60_000;
  private maxCalls = 20;
  /** Map of "<projectId>:<provider>" → timestamp[] */
  private windows: Map<string, number[]> = new Map();

  isAllowed(projectId: string, provider: string): boolean {
    const key = `${projectId}:${provider}`;
    const now = Date.now();
    const timestamps = (this.windows.get(key) ?? []).filter(
      (t) => now - t < this.windowMs,
    );
    if (timestamps.length >= this.maxCalls) {
      return false;
    }
    timestamps.push(now);
    this.windows.set(key, timestamps);
    return true;
  }
}

const rateLimiter = new VerificationRateLimiter();

/**
 * Central registry mapping provider names to verifier instances.
 *
 * Lookup is O(1). Falls back to "UNKNOWN" for any unregistered provider,
 * ensuring new providers never crash the verification worker.
 */
export class VerifierRegistry {
  private map: Map<string, VerifierProvider> = new Map();

  register(verifier: VerifierProvider): void {
    this.map.set(verifier.providerName.toLowerCase(), verifier);
  }

  /**
   * Find the registered verifier for this entry and call it.
   * Rate-limited per project+provider — returns UNKNOWN if the limit is reached.
   */
  async verify(
    entry: LedgerEntry,
    providerConfig: Record<string, any>,
    projectId: string,
  ): Promise<VerificationResult> {
    const providerName = (entry.provider ?? "").toLowerCase();

    if (!providerName) {
      // No provider tagged — cannot verify. Stay UNKNOWN.
      return { status: "UNKNOWN" };
    }

    if (!rateLimiter.isAllowed(projectId, providerName)) {
      console.warn(
        `[VerifierRegistry] Rate limit reached for project=${projectId} provider=${providerName}. Skipping.`,
      );
      return { status: "UNKNOWN" };
    }

    const verifier = this.map.get(providerName);
    if (!verifier) {
      // No built-in verifier and no custom verifier registered — stay UNKNOWN.
      return { status: "UNKNOWN" };
    }

    try {
      return await verifier.verify(entry, providerConfig);
    } catch (err: any) {
      console.error(
        `[VerifierRegistry] Verifier for "${providerName}" threw: ${err.message}`,
      );
      return { status: "UNKNOWN" };
    }
  }
}

export const verifierRegistry = new VerifierRegistry();
