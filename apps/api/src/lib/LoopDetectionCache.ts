/**
 * LoopDetectionCache
 *
 * A lightweight in-process TTL map for tracking GuardExecution attempt counts
 * and circuit breaker state per (monitorId, externalId) pair.
 *
 * Purpose: Avoid hitting Postgres on every guard.start() call for attempt counting
 * and breaker checks. During a retry storm the DB itself becomes the bottleneck;
 * this cache absorbs the hot path.
 *
 * Durability: Intentionally ephemeral — process restarts clear state. On a cache miss
 * the service falls back to Postgres for hydration. The DB remains source of truth
 * for audit history, compliance, and cross-instance consistency.
 *
 * Not suitable for: multi-instance deployments requiring shared state (use Redis adapter
 * when horizontal scaling is needed).
 */

interface CacheEntry {
  attempt: number;
  circuitBroken: boolean;
  cooldownUntil?: number; // unix ms — when the breaker auto-resets
  expiresAt: number; // unix ms — full entry eviction time
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, CacheEntry>();

function cacheKey(monitorId: string, externalId: string): string {
  return `${monitorId}::${externalId}`;
}

// Lightweight periodic eviction — no external scheduler needed.
// Runs every minute; removes only fully-expired entries.
const _evictionInterval = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt < now) store.delete(k);
  }
}, 60_000);

// Allow the process to exit cleanly even if this interval is running.
if (typeof (_evictionInterval as any).unref === "function") {
  (_evictionInterval as any).unref();
}

export const LoopDetectionCache = {
  /**
   * Returns the cached entry for a (monitorId, externalId) pair, or undefined
   * if no entry exists or it has expired (cache miss → hydrate from DB).
   */
  get(monitorId: string, externalId: string): CacheEntry | undefined {
    const entry = store.get(cacheKey(monitorId, externalId));
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      store.delete(cacheKey(monitorId, externalId));
      return undefined;
    }
    return entry;
  },

  /**
   * Writes or updates the attempt count for a (monitorId, externalId) pair.
   * Preserves existing circuit breaker state if an entry already exists.
   */
  setAttempt(monitorId: string, externalId: string, attempt: number): void {
    const k = cacheKey(monitorId, externalId);
    const existing = store.get(k);
    store.set(k, {
      attempt,
      circuitBroken: existing?.circuitBroken ?? false,
      cooldownUntil: existing?.cooldownUntil,
      expiresAt: Date.now() + TTL_MS,
    });
  },

  /**
   * Trips the circuit breaker for a (monitorId, externalId) pair.
   * @param cooldownMs  How long to block new executions (default: 60 minutes)
   */
  tripBreaker(
    monitorId: string,
    externalId: string,
    cooldownMs: number = 60 * 60 * 1000,
  ): void {
    const k = cacheKey(monitorId, externalId);
    const existing = store.get(k);
    store.set(k, {
      attempt: existing?.attempt ?? 5,
      circuitBroken: true,
      cooldownUntil: Date.now() + cooldownMs,
      expiresAt: Date.now() + TTL_MS,
    });
  },

  /**
   * Checks if the circuit breaker is currently tripped.
   * Auto-resets the in-memory flag once the cooldown has elapsed.
   *
   * @returns { broken: boolean, cooldownRemainingMs: number }
   */
  isBroken(
    monitorId: string,
    externalId: string,
  ): { broken: boolean; cooldownRemainingMs: number } {
    const k = cacheKey(monitorId, externalId);
    const entry = store.get(k);
    if (!entry?.circuitBroken) return { broken: false, cooldownRemainingMs: 0 };
    const remaining = (entry.cooldownUntil ?? 0) - Date.now();
    if (remaining <= 0) {
      // Cooldown elapsed — auto-reset in-memory flag
      entry.circuitBroken = false;
      entry.cooldownUntil = undefined;
      return { broken: false, cooldownRemainingMs: 0 };
    }
    return { broken: true, cooldownRemainingMs: remaining };
  },

  /**
   * Clears all entries. Useful in tests to reset state between cases.
   */
  clear(): void {
    store.clear();
  },
};
