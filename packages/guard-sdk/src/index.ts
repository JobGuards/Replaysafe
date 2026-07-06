import hash from "object-hash";

/**
 * Safe default fields to strip from inputs before fingerprinting.
 * These are transient values that change on each request but do NOT
 * alter the semantic meaning of the operation (timestamps, trace IDs, nonces).
 * Override via `ignoreKeys`, or disable entirely via `disableDefaultIgnoreKeys`.
 */
const DEFAULT_IGNORE_KEYS = new Set<string>([
  "timestamp",
  "createdAt",
  "updatedAt",
  "requestId",
  "traceId",
  "nonce",
  "idempotencyKey",
  "x-request-id",
]);

export interface GuardConfig {
  apiKey: string;
  monitorId: string;
  baseUrl?: string;
  failPolicy?: "OPEN" | "CLOSED";
  debug?: boolean;
  /**
   * Additional input keys to strip from fingerprint hashing beyond the safe defaults.
   * Safe defaults: timestamp, createdAt, updatedAt, requestId, traceId, nonce.
   *
   * ⚠️  Never add semantic business fields here (amount, currency, orderId, recipient).
   *     Stripping those would allow genuinely different operations to share a fingerprint.
   */
  ignoreKeys?: string[];
  /**
   * Strict mode — disables all safe-default ignore-keys.
   * Only the keys listed in `ignoreKeys` will be stripped (or none, if ignoreKeys is empty).
   * Use when you need full deterministic control over every fingerprint input.
   */
  disableDefaultIgnoreKeys?: boolean;
  /**
   * Network resilience config for SDK → Replaysafe API communication.
   * Production-grade defaults apply automatically — only override for tuning.
   */
  network?: {
    /** Abort timeout per request in ms. Default: 3000 */
    timeoutMs?: number;
    /** Max internal retries before failPolicy is applied. Default: 3 */
    maxRetries?: number;
    /** Base delay ms for exponential backoff between retries. Default: 200 */
    baseDelayMs?: number;
  };
}

export interface ReplayContext {
  executionId: string;
  attempt: number;
  token?: string;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
    multiplier: number;
  };
}

export type GuardAction = "EXECUTE" | "SKIP";
export type GuardScope = "MONITOR" | "PROJECT";

export interface GuardOptions {
  externalId?: string;
  workflowId?: string;
  agentId?: string;
  onRollback?: (rollback: any) => Promise<void> | void;
}

export interface VerifyResponse {
  action: GuardAction;
  cachedResult?: any;
  fingerprint: string;
}

/**
 * Thrown by guard.effect() when an operation exceeds its configured timeoutMs.
 * The effect has been marked UNKNOWN in the ledger — it may or may not have
 * executed on the provider side. Phase 7 verification will resolve this.
 *
 * Catch this specifically to implement timeout-aware error handling:
 * @example
 * try {
 *   await guard.effect({ ... });
 * } catch (e) {
 *   if (e instanceof EffectTimeoutError) {
 *     // operation result is uncertain — do not retry blindly
 *   }
 * }
 */
export class EffectTimeoutError extends Error {
  readonly fingerprint: string;
  constructor(message: string, fingerprint: string) {
    super(message);
    this.name = 'EffectTimeoutError';
    this.fingerprint = fingerprint;
  }
}

/**
 * Options for guard.effect() — the Phase 6 execution ledger primitive.
 */
export interface EffectOptions<T> {
  /** Semantic type label for the operation (e.g. "STRIPE_CHARGE", "SEND_EMAIL"). */
  type: string;
  /** Unique identifier for the target resource (order ID, email address, etc.). */
  target: string;
  /** Semantic inputs that uniquely identify this operation. Transient keys are stripped automatically. */
  input: any;
  /** Provider name for ledger visibility ("stripe", "sendgrid", "github", "slack", etc.). */
  provider?: string;
  /** The async operation to execute. */
  execute: () => Promise<T>;
  /**
   * Extracts provider-native proof from the result to store as receipt.
   * @example (result) => ({ chargeId: result.id })
   */
  receipt?: (result: T) => Record<string, any>;
  /**
   * Timeout for the execute lambda in ms.
   * If the operation exceeds this, Replaysafe marks the effect UNKNOWN and
   * throws EffectTimeoutError. Set to 0 to disable timeout.
   * Default: 30000 (30s)
   */
  timeoutMs?: number;
  /** Deduplication scope. Default: 'MONITOR' */
  scope?: GuardScope;
}

export class ReplayGuard {
  private config: GuardConfig;
  private context: ReplayContext | null = null;
  private localCache: Map<string, any> = new Map();

  constructor(config: GuardConfig) {
    this.config = {
      baseUrl: process.env.REPLAYSAFE_API_URL || "http://localhost:4040",
      failPolicy: "OPEN",
      debug: false,
      ...config,
      network: {
        timeoutMs: 3000,
        maxRetries: 3,
        baseDelayMs: 200,
        ...config.network,
      },
    };
  }

  /**
   * Initializes a ReplayGuard session for the current job run.
   *
   * Phase 6: accepts optional workflowId and agentId for ledger grouping.
   * All guard.effect() calls within this session will be tagged with these IDs.
   */
  async start(
    externalId?: string,
    workflowId?: string,
    agentId?: string
  ): Promise<ReplayContext | null> {
    try {
      const res = await this._fetchWithRetry(
        `${this.config.baseUrl}/api/guards/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            monitorId: this.config.monitorId,
            externalId,
            workflowId: workflowId ?? null,
            agentId: agentId ?? null,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to initialize session: ${await res.text()}`);
      }

      this.context = await res.json();
      return this.context!;
    } catch (error: any) {
      if (this.config.debug)
        console.error(
          `[ReplayGuard] Session initialization failed: ${error.message}`,
        );

      if (this.config.failPolicy === "CLOSED") {
        throw error;
      }

      if (this.config.debug)
        console.warn("[ReplayGuard] Proceeding without session (Fail Open)");
      return null;
    }
  }

  /**
   * Computes a cryptographic fingerprint for an operation based on its type, target, and inputs.
   * Strip safe default transient keys (timestamps, request IDs) automatically.
   */
  fingerprint(type: string, target: string, inputs: any): string {
    const inputHash = this._buildInputHash(inputs);
    return hash({ type, target, inputHash });
  }

  /**
   * Verifies if a side effect should be executed or skipped based on history.
   */
  async verify(
    type: string,
    target: string,
    inputs: any,
    scope: GuardScope = "MONITOR",
  ): Promise<VerifyResponse> {
    const fp = this.fingerprint(type, target, inputs);

    if (!this.context) {
      if (this.config.debug)
        console.warn(
          "[ReplayGuard] No active session. Executing without safety layer.",
        );
      return { action: "EXECUTE", fingerprint: fp };
    }

    // 1. Check local cache (Process-level deduplication)
    if (this.localCache.has(fp)) {
      if (this.config.debug)
        console.log(`[ReplayGuard] Local cache hit for: ${target}`);
      return {
        action: "SKIP",
        cachedResult: this.localCache.get(fp),
        fingerprint: fp,
      };
    }

    try {
      const res = await this._fetchWithRetry(
        `${this.config.baseUrl}/api/guards/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            executionId: this.context.executionId,
            token: this.context.token,
            fingerprint: fp,
            type,
            target,
            inputHash: this._buildInputHash(inputs),
            scope,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Verification failed: ${await res.text()}`);
      }

      const result: VerifyResponse = await res.json();
      result.fingerprint = fp;

      // Update local cache if skipped
      if (result.action === "SKIP") {
        this.localCache.set(fp, result.cachedResult);
      }

      return result;
    } catch (error: any) {
      if (this.config.debug) console.error(`[ReplayGuard] ${error.message}`);

      if (this.config.failPolicy === "CLOSED") {
        throw new Error(
          `[ReplayGuard] Safety check failed and failPolicy is CLOSED: ${error.message}`,
        );
      }

      if (this.config.debug)
        console.warn("[ReplayGuard] Defaulting to EXECUTE (Fail Open)");
      return { action: "EXECUTE", fingerprint: fp };
    }
  }

  /**
   * Finalizes the guarded execution.
   */
  async complete(
    status: "SUCCESS" | "FAILED",
    shouldRollback: boolean = false,
  ): Promise<any> {
    if (!this.context) return;

    try {
      const res = await this._fetchWithRetry(
        `${this.config.baseUrl}/api/guards/execution/${this.context.executionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            status,
            token: this.context.token,
            shouldRollback,
          }),
        },
      );

      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      if (this.config.debug)
        console.error("[ReplayGuard] Failed to complete session", e.message);
    } finally {
      this.context = null;
    }
  }

  /**
   * Guarded wrapper for HTTP fetch requests.
   */
  async fetch(
    url: string,
    options?: RequestInit,
    scope: GuardScope = "MONITOR",
  ): Promise<Response> {
    const inputs = {
      method: options?.method || "GET",
      body: options?.body,
    };

    const { action, cachedResult, fingerprint } = await this.verify(
      "HTTP",
      url,
      inputs,
      scope,
    );

    if (action === "SKIP") {
      if (this.config.debug)
        console.log(
          `[ReplayGuard] Skipping dangerous side effect (HTTP): ${url}`,
        );
      return new Response(JSON.stringify(cachedResult), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "x-replay-guard": "HIT",
        },
      });
    }

    // Auto-inject Idempotency-Key header on outbound request if not already present
    const modifiedOptions = { ...options };
    const rawHeaders = modifiedOptions.headers || {};
    let hasIdempotencyKey = false;

    if (typeof Headers !== "undefined" && rawHeaders instanceof Headers) {
      hasIdempotencyKey =
        rawHeaders.has("Idempotency-Key") || rawHeaders.has("idempotency-key");
      if (!hasIdempotencyKey) {
        rawHeaders.set("Idempotency-Key", fingerprint);
      }
    } else if (Array.isArray(rawHeaders)) {
      hasIdempotencyKey = (rawHeaders as string[][]).some(
        ([k]) => k.toLowerCase() === "idempotency-key",
      );
      if (!hasIdempotencyKey) {
        (rawHeaders as string[][]).push(["Idempotency-Key", fingerprint]);
      }
    } else {
      // Record<string, string>
      const lowerKeys = Object.keys(rawHeaders as Record<string, string>).map(
        (k) => k.toLowerCase(),
      );
      hasIdempotencyKey = lowerKeys.includes("idempotency-key");
      if (!hasIdempotencyKey) {
        modifiedOptions.headers = {
          ...(rawHeaders as Record<string, string>),
          "Idempotency-Key": fingerprint,
        };
      }
    }

    const response = await fetch(url, modifiedOptions);

    // Report result if successful
    if (response.ok) {
      try {
        const body = await response.clone().json();
        await this.reportResult("HTTP", url, inputs, body);
      } catch (e) {
        // Fallback for non-JSON bodies
      }
    }

    return response;
  }

  // ─────────────────────────────────────────────────────────────────
  // Phase 6 — Execution Ledger primitives
  // ─────────────────────────────────────────────────────────────────

  /**
   * Guarded execution wrapper with full lifecycle tracking.
   *
   * Unlike guard.wrap(), this method:
   * - Writes an EXECUTING record BEFORE running the operation
   * - Writes a COMMITTED record with provider receipt AFTER success
   * - Writes an UNKNOWN record if the operation times out
   * - Writes a FAILED record if the operation throws
   *
   * guard.wrap() is a backward-compatible shim over this method.
   *
   * @example
   * const charge = await guard.effect({
   *   type: 'STRIPE_CHARGE',
   *   target: order.id,
   *   input: { amount, currency },
   *   provider: 'stripe',
   *   execute: () => stripe.charges.create({ amount, currency }),
   *   receipt: (result) => ({ chargeId: result.id }),
   * });
   */
  async effect<T>(options: EffectOptions<T>): Promise<T> {
    const { type, target, input, provider, execute, receipt, timeoutMs = 30_000, scope = 'MONITOR' } = options;
    const fp = this.fingerprint(type, target, input);

    if (!this.context) {
      if (this.config.debug) console.warn('[ReplayGuard] No session. Running effect without safety layer.');
      return execute();
    }

    // 1. Local cache check (process-level dedup — fastest path)
    if (this.localCache.has(fp)) {
      if (this.config.debug) console.log(`[ReplayGuard] Local cache hit (effect): ${type}:${target}`);
      return this.localCache.get(fp) as T;
    }

    // 2. Begin: check ledger dedup + write EXECUTING
    let beginResult: { action: 'EXECUTE' | 'SKIP'; cachedResult?: any };
    try {
      beginResult = await this._callBegin(fp, type, target, input, provider, scope);
    } catch (e: any) {
      if (this.config.debug) console.error(`[ReplayGuard] effect.begin failed: ${e.message}`);
      if (this.config.failPolicy === 'CLOSED') throw e;
      // Fail open — run the operation without ledger tracking
      return execute();
    }

    if (beginResult.action === 'SKIP') {
      if (this.config.debug) console.log(`[ReplayGuard] SKIP (effect): ${type}:${target}`);
      this.localCache.set(fp, beginResult.cachedResult);
      return beginResult.cachedResult as T;
    }

    // 3. Execute with optional timeout
    let result: T;
    try {
      if (timeoutMs > 0) {
        result = await this._withOperationTimeout(execute, timeoutMs, fp, type, target);
      } else {
        result = await execute();
      }
    } catch (err: any) {
      // EffectTimeoutError is already handled inside _withOperationTimeout (UNKNOWN marked)
      // For regular errors: mark FAILED and re-throw
      if (!(err instanceof EffectTimeoutError)) {
        await this._callMarkFailed(fp, err.message).catch(() => {});
      }
      throw err;
    }

    // 4. Commit: write result + receipt → COMMITTED
    const receiptData = receipt ? receipt(result) : undefined;
    await this._callCommit(fp, result, receiptData).catch((e: any) => {
      if (this.config.debug) console.error(`[ReplayGuard] effect.commit failed: ${e.message}`);
    });

    this.localCache.set(fp, result);
    return result;
  }

  /**
   * Generic wrapper for any dangerous operation.
   *
   * Backward-compatible shim over guard.effect().
   * Existing behavior is preserved exactly — no EXECUTING phase, no timeout.
   * For full lifecycle tracking, use guard.effect() instead.
   */
  async wrap<T>(
    type: string,
    target: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.effect<T>({
      type,
      target,
      input: inputs,
      execute: operation,
      timeoutMs: 0,   // preserve existing behavior: no operation timeout
      scope,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Internal Utilities
  // ─────────────────────────────────────────────────────────────────

  /**
   * Builds a deterministic input hash by stripping transient fields that change
   * between retries but don't alter the semantic meaning of the operation.
   *
   * Safe-default ignore-keys (timestamps, trace IDs, nonces) are stripped automatically
   * unless `disableDefaultIgnoreKeys: true` is set. Add custom fields via `ignoreKeys`.
   *
   * Debug mode logs which fields were stripped so you can audit fingerprint behavior.
   */
  private _buildInputHash(inputs: any): string {
    if (
      typeof inputs !== "object" ||
      inputs === null ||
      Array.isArray(inputs)
    ) {
      return hash(inputs);
    }

    const ignoreSet: Set<string> = this.config.disableDefaultIgnoreKeys
      ? new Set(this.config.ignoreKeys ?? [])
      : new Set([...DEFAULT_IGNORE_KEYS, ...(this.config.ignoreKeys ?? [])]);

    const normalized = Object.fromEntries(
      Object.entries(inputs).filter(([k]) => !ignoreSet.has(k)),
    );

    if (this.config.debug) {
      const stripped = Object.keys(inputs).filter((k) => ignoreSet.has(k));
      if (stripped.length > 0) {
        console.debug(
          `[ReplayGuard] Stripped transient fields from fingerprint: [${stripped.join(", ")}]`,
        );
      }
    }

    return hash(normalized);
  }

  /**
   * Wraps a fetch call with a configurable AbortSignal timeout.
   * Prevents the SDK from hanging indefinitely when the Replaysafe API is slow or unresponsive.
   */
  private async _fetchWithTimeout(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const timeoutMs = this.config.network?.timeoutMs ?? 3000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  /**
   * Wraps `_fetchWithTimeout` with exponential backoff + full jitter retries.
   * Absorbs transient network faults before escalating to the configured failPolicy.
   *
   * Default: 3 retries, 200ms base delay, jitter capped at 1600ms.
   * Transient faults that resolve within ~4s will never surface to your job.
   */
  private async _fetchWithRetry(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const maxRetries = this.config.network?.maxRetries ?? 3;
    const baseDelayMs = this.config.network?.baseDelayMs ?? 200;
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this._fetchWithTimeout(url, options);
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const cap = baseDelayMs * Math.pow(2, attempt);
          const jitter = Math.random() * Math.min(cap, 1600);
          if (this.config.debug) {
            console.debug(
              `[ReplayGuard] SDK retry ${attempt + 1}/${maxRetries} in ${Math.round(jitter)}ms — ${err.message}`,
            );
          }
          await new Promise((r) => setTimeout(r, jitter));
        }
      }
    }
    throw lastError;
  }

  // ─────────────────────────────────────────────────────────────────
  // Phase 6 private API helpers
  // ─────────────────────────────────────────────────────────────────

  /** Calls POST /api/guards/effect/begin */
  private async _callBegin(
    fp: string,
    type: string,
    target: string,
    input: any,
    provider?: string,
    scope: GuardScope = 'MONITOR'
  ): Promise<{ action: 'EXECUTE' | 'SKIP'; cachedResult?: any }> {
    const res = await this._fetchWithRetry(`${this.config.baseUrl}/api/guards/effect/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey },
      body: JSON.stringify({
        executionId: this.context!.executionId,
        token: this.context!.token,
        fingerprint: fp,
        type,
        target,
        inputHash: this._buildInputHash(input),
        provider: provider ?? null,
        workflowId: (this.context as any).workflowId ?? null,
        agentId: (this.context as any).agentId ?? null,
        scope,
      }),
    });
    if (!res.ok) throw new Error(`[ReplayGuard] effect/begin failed: ${await res.text()}`);
    return res.json();
  }

  /** Calls POST /api/guards/effect/commit */
  private async _callCommit(
    fp: string,
    result: any,
    receipt?: Record<string, any>
  ): Promise<void> {
    const res = await this._fetchWithRetry(`${this.config.baseUrl}/api/guards/effect/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey },
      body: JSON.stringify({
        executionId: this.context!.executionId,
        token: this.context!.token,
        fingerprint: fp,
        result,
        receipt: receipt ?? null,
      }),
    });
    if (!res.ok && this.config.debug) console.error(`[ReplayGuard] effect/commit failed: ${await res.text()}`);
  }

  /** Calls POST /api/guards/effect/unknown */
  private async _callMarkUnknown(fp: string, reason: string): Promise<void> {
    try {
      await this._fetchWithRetry(`${this.config.baseUrl}/api/guards/effect/unknown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey },
        body: JSON.stringify({
          executionId: this.context!.executionId,
          token: this.context!.token,
          fingerprint: fp,
          reason,
        }),
      });
    } catch (e: any) {
      if (this.config.debug) console.error(`[ReplayGuard] effect/unknown failed: ${e.message}`);
    }
  }

  /** Calls POST /api/guards/effect/unknown for FAILED outcomes */
  private async _callMarkFailed(fp: string, errorMessage: string): Promise<void> {
    try {
      // Reuse the unknown route with a descriptive reason; Phase 7 will resolve status
      // A dedicated /effect/failed route is available on the API if needed in the future.
      await this._fetchWithRetry(`${this.config.baseUrl}/api/guards/effect/unknown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.config.apiKey },
        body: JSON.stringify({
          executionId: this.context!.executionId,
          token: this.context!.token,
          fingerprint: fp,
          reason: `Operation failed: ${errorMessage}`,
        }),
      });
    } catch (e: any) {
      if (this.config.debug) console.error(`[ReplayGuard] effect/markFailed failed: ${e.message}`);
    }
  }

  /**
   * Races the execute lambda against a timer.
   * If the timer wins: marks the effect UNKNOWN, throws EffectTimeoutError.
   * If execute wins: returns the result normally.
   */
  private _withOperationTimeout<T>(
    execute: () => Promise<T>,
    timeoutMs: number,
    fp: string,
    type: string,
    target: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const reason = `Operation timed out after ${timeoutMs}ms`;
        // Fire-and-forget: mark UNKNOWN in the ledger, then reject
        this._callMarkUnknown(fp, reason).catch(() => {});
        reject(new EffectTimeoutError(
          `[ReplayGuard] ${type}:${target} timed out after ${timeoutMs}ms`,
          fp
        ));
      }, timeoutMs);

      execute().then(
        (result) => { clearTimeout(timer); resolve(result); },
        (err)    => { clearTimeout(timer); reject(err); }
      );
    });
  }

  /**
   * Reports the successful result of a side effect to the execution memory.
   * Used internally by legacy paths (guard.fetch, etc.) that don't use guard.effect().
   */
  private async reportResult(
    type: string,
    target: string,
    inputs: any,
    result: any,
  ): Promise<void> {
    if (!this.context) return;

    const inputHash = this._buildInputHash(inputs);
    const fingerprint = hash({ type, target, inputHash });

    // Update local cache
    this.localCache.set(fingerprint, result);

    try {
      await this._fetchWithRetry(`${this.config.baseUrl}/api/guards/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
        },
        body: JSON.stringify({
          executionId: this.context.executionId,
          token: this.context.token,
          fingerprint,
          type,
          target,
          inputHash,
          metadata: result,
        }),
      });
    } catch (e: any) {
      if (this.config.debug)
        console.error(`[ReplayGuard] Failed to report result: ${e.message}`);
    }
  }

  /**
   * High-level AI/LLM wrapper for expensive model calls.
   * Automatically handles fingerprinting of model parameters.
   */
  async ai<T>(
    model: string,
    params: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("AI_GENERATION", model, params, operation, scope);
  }

  /**
   * Specialized wrapper for outbound webhooks.
   * Ensures idempotency for external service notifications.
   */
  async webhook<T>(
    target: string,
    payload: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("WEBHOOK", target, payload, operation, scope);
  }

  /**
   * Registers a compensation (rollback) action for a previously executed side effect.
   * This action will be triggered if the execution is completed with shouldRollback: true.
   */
  async compensate(
    type: string,
    target: string,
    inputs: any,
    rollbackData: { type: string; target: string; payload?: any },
  ): Promise<void> {
    if (!this.context) return;

    const inputHash = this._buildInputHash(inputs);
    const fingerprint = hash({ type, target, inputHash });

    try {
      await this._fetchWithRetry(
        `${this.config.baseUrl}/api/guards/rollback/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            executionId: this.context.executionId,
            token: this.context.token,
            fingerprint,
            rollback: rollbackData,
          }),
        },
      );
      if (this.config.debug)
        console.log(`[ReplayGuard] Rollback registered for: ${target}`);
    } catch (e: any) {
      if (this.config.debug)
        console.error(
          `[ReplayGuard] Failed to register rollback: ${e.message}`,
        );
    }
  }

  /**
   * Captures a snapshot of the current infrastructure state.
   * Used to detect "State Drift" between job attempts.
   */
  async snapshot(key: string, state: any): Promise<void> {
    if (!this.context) return;

    const inputHash = hash(state);

    try {
      await this._fetchWithRetry(`${this.config.baseUrl}/api/guards/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
        },
        body: JSON.stringify({
          executionId: this.context.executionId,
          token: this.context.token,
          fingerprint: hash({ type: "STATE_SNAPSHOT", key, inputHash }),
          type: "STATE_SNAPSHOT",
          target: key,
          inputHash,
          metadata: state,
        }),
      });
    } catch (e) {
      console.error("[ReplayGuard] Failed to record snapshot", e);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Framework Adapters — Drop-in safety proxy for any orchestrator.
  // Each adapter is a semantically-named thin wrapper over `wrap()`.
  // The safety engine underneath is identical — only the intent is named.
  // ─────────────────────────────────────────────────────────────────

  /**
   * LangGraph adapter — wraps a LangGraph node's side-effecting tool call
   * with replay-safe deduplication — side effects execute at most once per unique
   * input set, regardless of how many times the node is retried.
   *
   * @example
   * // In a LangGraph node:
   * const result = await guard.langGraph(
   *   'send_email_node',
   *   { to: user.email, template: 'welcome' },
   *   () => sendEmail(user.email, 'Welcome!')
   * );
   */
  async langGraph<T>(
    nodeId: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("LANGGRAPH_NODE", nodeId, inputs, operation, scope);
  }

  /**
   * Inngest adapter — wraps an Inngest function step with replay-safe deduplication.
   * Use inside `step.run()` for steps that have non-idempotent external side effects.
   *
   * @example
   * // In an Inngest function:
   * createFunction({ id: 'onboarding' }, { event: 'user.created' }, async ({ event, step }) => {
   *   await step.run('send-welcome-email', () =>
   *     guard.inngest('send-welcome-email', { userId: event.data.userId },
   *       () => sendEmail(event.data.email, 'Welcome!')
   *     )
   *   );
   * });
   */
  async inngest<T>(
    functionId: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("INNGEST_STEP", functionId, inputs, operation, scope);
  }

  /**
   * n8n adapter — wraps an n8n workflow node's outbound operation with
   * replay-safe deduplication, preventing duplicate API calls during n8n retries.
   *
   * @example
   * // In an n8n Code node:
   * const result = await guard.n8n(
   *   'hubspot-contact-create',
   *   { email: $input.item.json.email },
   *   () => $http.post('https://api.hubspot.com/crm/v3/objects/contacts', payload)
   * );
   */
  async n8n<T>(
    nodeName: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("N8N_NODE", nodeName, inputs, operation, scope);
  }

  /**
   * Apache Airflow adapter — wraps an Airflow task's side-effecting operation
   * with replay-safe deduplication, safe for use inside PythonOperator callbacks
   * via the JS/TS bridge or in TypeScript-based DAG runners.
   *
   * @example
   * const result = await guard.airflow(
   *   'my_dag.send_report_task',
   *   { runId: context.run_id, reportDate: '2025-01-01' },
   *   () => generateAndEmailReport(reportDate)
   * );
   */
  async airflow<T>(
    taskId: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("AIRFLOW_TASK", taskId, inputs, operation, scope);
  }

  /**
   * CrewAI adapter — wraps a CrewAI tool execution with replay-safe deduplication,
   * preventing duplicate tool calls when agents are restarted or re-routed.
   *
   * @example
   * // In a CrewAI custom tool:
   * const result = await guard.crewai(
   *   'web_search_tool',
   *   { query: 'latest AI safety research', agentId: agent.id },
   *   () => performWebSearch(query)
   * );
   */
  async crewai<T>(
    toolName: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("CREWAI_TOOL", toolName, inputs, operation, scope);
  }

  /**
   * Stripe adapter — wraps a Stripe operation with replay-safe deduplication,
   * recommended for defense-in-depth payment integrations.
   *
   * @example
   * const result = await guard.stripe(
   *   'charge_customer',
   *   { amount: 5000, customerId: 'cust_123' },
   *   () => stripe.charges.create({ amount: 5000, customer: 'cust_123' })
   * );
   */
  async stripe<T>(
    operationId: string,
    inputs: any,
    operation: () => Promise<T>,
    scope: GuardScope = "MONITOR",
  ): Promise<T> {
    return this.wrap("STRIPE_OPERATION", operationId, inputs, operation, scope);
  }
}

/**
 * High-level HOF for wrapping entire jobs.
 */
export async function withReplayGuard<T>(
  config: GuardConfig,
  job: (guard: ReplayGuard) => Promise<T>,
  options?: string | GuardOptions,
): Promise<T> {
  const guard = new ReplayGuard(config);

  const opt: GuardOptions =
    typeof options === "string" ? { externalId: options } : options || {};

  try {
    await guard.start(opt.externalId);
  } catch (error) {
    throw error;
  }

  try {
    const result = await job(guard);
    await guard.complete("SUCCESS");
    return result;
  } catch (error) {
    // Automatically trigger rollback on failure (best-effort — never masks original error)
    try {
      const completion = await guard.complete("FAILED", true);
      if (completion?.rollbacks && opt.onRollback) {
        if (config.debug)
          console.log(
            `[ReplayGuard] Executing ${completion.rollbacks.length} rollback hooks`,
          );
        for (const rb of completion.rollbacks) {
          await Promise.resolve(opt.onRollback(rb)).catch((e: any) => {
            if (config.debug)
              console.error(`[ReplayGuard] Rollback hook failed: ${e.message}`);
          });
        }
      }
    } catch (completeErr) {
      if (config.debug)
        console.error(
          `[ReplayGuard] Session completion failed (original error preserved): ${completeErr}`,
        );
    }

    throw error;
  }
}
