import hash from 'object-hash';

export interface GuardConfig {
  apiKey: string;
  monitorId: string;
  baseUrl?: string;
}

export interface ReplayContext {
  executionId: string;
  attempt: number;
  token?: string;
}

export type GuardAction = 'EXECUTE' | 'SKIP';

export interface VerifyResponse {
  action: GuardAction;
  cachedResult?: any;
}

export class ReplayGuard {
  private config: GuardConfig;
  private context: ReplayContext | null = null;

  constructor(config: GuardConfig) {
    this.config = {
      baseUrl: process.env.STILLUP_API_URL || 'http://localhost:4040',
      ...config,
    };
  }

  /**
   * Initializes a ReplayGuard session for the current job run.
   */
  async start(externalId?: string): Promise<ReplayContext> {
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
      throw new Error(`[ReplayGuard] Failed to initialize session: ${await res.text()}`);
    }

    this.context = await res.json();
    return this.context!;
  }

  /**
   * Verifies if a side effect should be executed or skipped based on history.
   */
  async verify(type: string, target: string, inputs: any): Promise<VerifyResponse> {
    if (!this.context) {
      console.warn('[ReplayGuard] No active session. Executing without safety layer.');
      return { action: 'EXECUTE' };
    }

    const inputHash = hash(inputs);
    const fingerprint = hash({ type, target, inputHash });

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
      }),
    });

    if (!res.ok) {
      console.error(`[ReplayGuard] Verification failed: ${await res.text()}. Defaulting to EXECUTE.`);
      return { action: 'EXECUTE' };
    }

    return await res.json();
  }

  /**
   * Finalizes the guarded execution.
   */
  async complete(status: 'SUCCESS' | 'FAILED') {
    if (!this.context) return;

    try {
      await fetch(`${this.config.baseUrl}/api/guards/execution/${this.context.executionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({ 
          status,
          token: this.context.token
        }),
      });
    } catch (e) {
      console.error('[ReplayGuard] Failed to complete session', e);
    } finally {
      this.context = null;
    }
  }

  /**
   * Guarded wrapper for HTTP fetch requests.
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const { action, cachedResult } = await this.verify('HTTP', url, {
      method: options?.method || 'GET',
      body: options?.body,
    });

    if (action === 'SKIP') {
      console.log(`[ReplayGuard] Skipping dangerous side effect (HTTP): ${url}`);
      // In a real SDK, we'd reconstruct the response from cachedResult
      return new Response(JSON.stringify(cachedResult), { status: 200 });
    }

    return await fetch(url, options);
  }

  /**
   * Generic wrapper for any dangerous operation.
   */
  async wrap<T>(type: string, target: string, inputs: any, operation: () => Promise<T>): Promise<T> {
    const { action, cachedResult } = await this.verify(type, target, inputs);

    if (action === 'SKIP') {
      console.log(`[ReplayGuard] Skipping dangerous side effect (${type}): ${target}`);
      return cachedResult as T;
    }

    return await operation();
  }
}

/**
 * High-level HOF for wrapping entire jobs.
 */
export async function withReplayGuard<T>(
  config: GuardConfig,
  job: (guard: ReplayGuard) => Promise<T>,
  externalId?: string
): Promise<T> {
  const guard = new ReplayGuard(config);
  await guard.start(externalId);

  try {
    const result = await job(guard);
    await guard.complete('SUCCESS');
    return result;
  } catch (error) {
    await guard.complete('FAILED');
    throw error;
  }
}
