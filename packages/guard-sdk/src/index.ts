import hash from 'object-hash';

export interface GuardConfig {
  apiKey: string;
  monitorId: string;
  baseUrl?: string;
  failPolicy?: 'OPEN' | 'CLOSED';
  debug?: boolean;
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

export type GuardAction = 'EXECUTE' | 'SKIP';
export type GuardScope = 'MONITOR' | 'PROJECT';

export interface GuardOptions {
  externalId?: string;
  onRollback?: (rollback: any) => Promise<void> | void;
}

export interface VerifyResponse {
  action: GuardAction;
  cachedResult?: any;
}

export class ReplayGuard {
  private config: GuardConfig;
  private context: ReplayContext | null = null;
  private localCache: Map<string, any> = new Map();

  constructor(config: GuardConfig) {
    this.config = {
      baseUrl: process.env.STILLUP_API_URL || 'http://localhost:4040',
      failPolicy: 'OPEN',
      debug: false,
      ...config,
    };
  }

  /**
   * Initializes a ReplayGuard session for the current job run.
   */
  async start(externalId?: string): Promise<ReplayContext | null> {
    try {
      const res = await fetch(`${this.config.baseUrl}/api/guards/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          monitorId: this.config.monitorId,
          externalId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initialize session: ${await res.text()}`);
      }

      this.context = await res.json();
      return this.context!;
    } catch (error: any) {
      if (this.config.debug) console.error(`[ReplayGuard] Session initialization failed: ${error.message}`);
      
      if (this.config.failPolicy === 'CLOSED') {
        throw error;
      }

      if (this.config.debug) console.warn('[ReplayGuard] Proceeding without session (Fail Open)');
      return null;
    }
  }

  /**
   * Verifies if a side effect should be executed or skipped based on history.
   */
  async verify(
    type: string, 
    target: string, 
    inputs: any, 
    scope: GuardScope = 'MONITOR'
  ): Promise<VerifyResponse> {
    if (!this.context) {
      if (this.config.debug) console.warn('[ReplayGuard] No active session. Executing without safety layer.');
      return { action: 'EXECUTE' };
    }

    const inputHash = hash(inputs);
    const fingerprint = hash({ type, target, inputHash });

    // 1. Check local cache (Process-level deduplication)
    if (this.localCache.has(fingerprint)) {
      if (this.config.debug) console.log(`[ReplayGuard] Local cache hit for: ${target}`);
      return { action: 'SKIP', cachedResult: this.localCache.get(fingerprint) };
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/guards/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          executionId: this.context.executionId,
          token: this.context.token,
          fingerprint,
          type,
          target,
          inputHash,
          scope,
        }),
      });

      if (!res.ok) {
        throw new Error(`Verification failed: ${await res.text()}`);
      }

      const result: VerifyResponse = await res.json();
      
      // Update local cache if skipped
      if (result.action === 'SKIP') {
        this.localCache.set(fingerprint, result.cachedResult);
      }

      return result;
    } catch (error: any) {
      if (this.config.debug) console.error(`[ReplayGuard] ${error.message}`);
      
      if (this.config.failPolicy === 'CLOSED') {
        throw new Error(`[ReplayGuard] Safety check failed and failPolicy is CLOSED: ${error.message}`);
      }

      if (this.config.debug) console.warn('[ReplayGuard] Defaulting to EXECUTE (Fail Open)');
      return { action: 'EXECUTE' };
    }
  }

  /**
   * Finalizes the guarded execution.
   */
  async complete(status: 'SUCCESS' | 'FAILED', shouldRollback: boolean = false): Promise<any> {
    if (!this.context) return;

    try {
      const res = await fetch(`${this.config.baseUrl}/api/guards/execution/${this.context.executionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({ 
          status,
          token: this.context.token,
          shouldRollback
        }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      if (this.config.debug) console.error('[ReplayGuard] Failed to complete session', e.message);
    } finally {
      this.context = null;
    }
  }

  /**
   * Guarded wrapper for HTTP fetch requests.
   */
  async fetch(url: string, options?: RequestInit, scope: GuardScope = 'MONITOR'): Promise<Response> {
    const { action, cachedResult } = await this.verify('HTTP', url, {
      method: options?.method || 'GET',
      body: options?.body,
    }, scope);

    if (action === 'SKIP') {
      if (this.config.debug) console.log(`[ReplayGuard] Skipping dangerous side effect (HTTP): ${url}`);
      return new Response(JSON.stringify(cachedResult), { 
        status: 200,
        headers: { 'Content-Type': 'application/json', 'x-replay-guard': 'HIT' }
      });
    }

    const response = await fetch(url, options);
    
    // Report result if successful
    if (response.ok) {
      try {
        const body = await response.clone().json();
        await this.reportResult('HTTP', url, {
          method: options?.method || 'GET',
          body: options?.body,
        }, body);
      } catch (e) {
        // Fallback for non-JSON bodies
      }
    }

    return response;
  }

  /**
   * Generic wrapper for any dangerous operation.
   */
  async wrap<T>(
    type: string, 
    target: string, 
    inputs: any, 
    operation: () => Promise<T>,
    scope: GuardScope = 'MONITOR'
  ): Promise<T> {
    const { action, cachedResult } = await this.verify(type, target, inputs, scope);

    if (action === 'SKIP') {
      if (this.config.debug) console.log(`[ReplayGuard] Replaying cached result for (${type}): ${target}`);
      return cachedResult as T;
    }

    try {
      const result = await operation();
      
      // Update local cache immediately
      const inputHash = hash(inputs);
      const fingerprint = hash({ type, target, inputHash });
      this.localCache.set(fingerprint, result);

      await this.reportResult(type, target, inputs, result);
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reports the successful result of a side effect to the execution memory.
   */
  private async reportResult(type: string, target: string, inputs: any, result: any): Promise<void> {
    if (!this.context) return;

    const inputHash = hash(inputs);
    const fingerprint = hash({ type, target, inputHash });

    // Update local cache
    this.localCache.set(fingerprint, result);

    try {
      await fetch(`${this.config.baseUrl}/api/guards/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
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
      if (this.config.debug) console.error(`[ReplayGuard] Failed to report result: ${e.message}`);
    }
  }

  /**
   * High-level AI/LLM wrapper for expensive model calls.
   * Automatically handles fingerprinting of model parameters.
   */
  async ai<T>(model: string, params: any, operation: () => Promise<T>, scope: GuardScope = 'MONITOR'): Promise<T> {
    return this.wrap('AI_GENERATION', model, params, operation, scope);
  }

  /**
   * Specialized wrapper for outbound webhooks.
   * Ensures idempotency for external service notifications.
   */
  async webhook<T>(target: string, payload: any, operation: () => Promise<T>, scope: GuardScope = 'MONITOR'): Promise<T> {
    return this.wrap('WEBHOOK', target, payload, operation, scope);
  }

  /**
   * Registers a compensation (rollback) action for a previously executed side effect.
   * This action will be triggered if the execution is completed with shouldRollback: true.
   */
  async compensate(
    type: string, 
    target: string, 
    inputs: any, 
    rollbackData: { type: string, target: string, payload?: any }
  ): Promise<void> {
    if (!this.context) return;

    const inputHash = hash(inputs);
    const fingerprint = hash({ type, target, inputHash });

    try {
      await fetch(`${this.config.baseUrl}/api/guards/rollback/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          executionId: this.context.executionId,
          token: this.context.token,
          fingerprint,
          rollback: rollbackData
        }),
      });
      if (this.config.debug) console.log(`[ReplayGuard] Rollback registered for: ${target}`);
    } catch (e: any) {
      if (this.config.debug) console.error(`[ReplayGuard] Failed to register rollback: ${e.message}`);
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
      await fetch(`${this.config.baseUrl}/api/guards/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          executionId: this.context.executionId,
          token: this.context.token,
          fingerprint: hash({ type: 'STATE_SNAPSHOT', key, inputHash }),
          type: 'STATE_SNAPSHOT',
          target: key,
          inputHash,
          metadata: state,
        }),
      });
    } catch (e) {
      console.error('[ReplayGuard] Failed to record snapshot', e);
    }
  }
}

/**
 * High-level HOF for wrapping entire jobs.
 */
export async function withReplayGuard<T>(
  config: GuardConfig,
  job: (guard: ReplayGuard) => Promise<T>,
  options?: string | GuardOptions
): Promise<T> {
  const guard = new ReplayGuard(config);
  
  const opt: GuardOptions = typeof options === 'string' 
    ? { externalId: options } 
    : options || {};

  try {
    await guard.start(opt.externalId);
  } catch (error) {
    throw error;
  }

  try {
    const result = await job(guard);
    await guard.complete('SUCCESS');
    return result;
  } catch (error) {
    // Automatically trigger rollback on failure
    const completion = await guard.complete('FAILED', true);
    
    if (completion?.rollbacks && opt.onRollback) {
      if (config.debug) console.log(`[ReplayGuard] Executing ${completion.rollbacks.length} rollback hooks`);
      for (const rb of completion.rollbacks) {
        await opt.onRollback(rb);
      }
    }
    
    throw error;
  }
}
