import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReplayGuard, EffectTimeoutError } from '../../../../packages/guard-sdk/src/index.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeGuard(overrides: Record<string, any> = {}) {
  return new ReplayGuard({
    apiKey: 'sk_test_123',
    monitorId: 'monitor_123',
    network: { maxRetries: 0, baseDelayMs: 1, timeoutMs: 100 },
    ...overrides,
  });
}

function mockFetchSequence(...responses: any[]) {
  const mockFetch = vi.fn();
  responses.forEach((r) => {
    if (r instanceof Error) {
      mockFetch.mockRejectedValueOnce(r);
    } else {
      mockFetch.mockResolvedValueOnce(r);
    }
  });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

function jsonResponse(body: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function sessionResponse(overrides: Record<string, any> = {}) {
  return jsonResponse({
    executionId: 'exec_123',
    attempt: 1,
    token: 'exec_123.sig_abc',
    workflowId: null,
    agentId: null,
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6: guard.effect() tests
// ─────────────────────────────────────────────────────────────────────────────

describe('guard.effect() — Phase 6 Execution Ledger', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('calls begin → execute → commit in order when no prior record exists', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),                              // start()
      jsonResponse({ action: 'EXECUTE' }),            // /effect/begin → EXECUTE
      jsonResponse({ ok: true }),                     // /effect/commit
    );

    const guard = makeGuard();
    await guard.start('job-1');

    const execute = vi.fn().mockResolvedValue({ id: 'ch_xyz' });
    const result = await guard.effect({
      type: 'STRIPE_CHARGE',
      target: 'order_123',
      input: { amount: 5000 },
      provider: 'stripe',
      execute,
      receipt: (r: { id: string }) => ({ chargeId: r.id }),
      timeoutMs: 0,
    });

    expect(result).toEqual({ id: 'ch_xyz' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify call order
    const calls = mockFetch.mock.calls.map((c: any[]) => c[0] as string);
    expect(calls[0]).toContain('/api/guards/session');
    expect(calls[1]).toContain('/api/guards/effect/begin');
    expect(calls[2]).toContain('/api/guards/effect/commit');
  });

  it('skips execute lambda and returns cachedResult when begin returns SKIP', async () => {
    const cached = { id: 'ch_already_done' };
    mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'SKIP', cachedResult: cached }),  // /effect/begin → SKIP
    );

    const guard = makeGuard();
    await guard.start('job-1');

    const execute = vi.fn();
    const result = await guard.effect({
      type: 'STRIPE_CHARGE',
      target: 'order_123',
      input: { amount: 5000 },
      execute,
      timeoutMs: 0,
    });

    expect(result).toEqual(cached);
    expect(execute).not.toHaveBeenCalled();
  });

  it('calls /effect/unknown and throws EffectTimeoutError when operation times out', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),                              // start()
      jsonResponse({ action: 'EXECUTE' }),            // /effect/begin
      jsonResponse({ ok: true }),                     // /effect/unknown
    );

    const guard = makeGuard();
    await guard.start('job-1');

    // Operation that never resolves within timeout
    const execute = vi.fn(() => new Promise<never>(() => {}));

    await expect(
      guard.effect({
        type: 'EMAIL',
        target: 'user@example.com',
        input: { subject: 'test' },
        execute,
        timeoutMs: 50,
      })
    ).rejects.toThrow(EffectTimeoutError);

    // Give fire-and-forget time to flush
    await new Promise(r => setTimeout(r as any, 20));

    const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string);
    expect(urls).toContain('http://localhost:4040/api/guards/effect/unknown');
  });

  it('calls /effect/unknown and re-throws when operation throws', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),
      jsonResponse({ ok: true }),   // /effect/unknown (FAILED path)
    );

    const guard = makeGuard();
    await guard.start('job-1');

    const boom = new Error('Network failure');
    await expect(
      guard.effect({
        type: 'CRM_UPDATE',
        target: 'contact_456',
        input: { status: 'paid' },
        execute: () => Promise.reject(boom),
        timeoutMs: 0,
      })
    ).rejects.toThrow('Network failure');

    await new Promise(r => setTimeout(r as any, 10));
    const urls = mockFetch.mock.calls.map((c: any[]) => c[0] as string);
    expect(urls).toContain('http://localhost:4040/api/guards/effect/unknown');
  });

  it('uses local cache on second call to same effect within same session', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),
      jsonResponse({ ok: true }),   // commit
    );

    const guard = makeGuard();
    await guard.start('job-1');

    const execute = vi.fn().mockResolvedValue({ id: 'ch_local' });
    const opts = { type: 'CHARGE', target: 'order_1', input: { amount: 100 }, execute, timeoutMs: 0 };

    const r1 = await guard.effect(opts);
    const r2 = await guard.effect(opts);

    expect(r1).toEqual({ id: 'ch_local' });
    expect(r2).toEqual({ id: 'ch_local' });
    expect(execute).toHaveBeenCalledTimes(1); // second call uses local cache
    expect(mockFetch).toHaveBeenCalledTimes(3); // start + begin + commit
  });

  it('runs execute directly (fail open) when no session exists', async () => {
    vi.stubGlobal('fetch', vi.fn()); // no fetch calls expected
    const guard = makeGuard({ failPolicy: 'OPEN' });
    // No guard.start() call

    const execute = vi.fn().mockResolvedValue({ id: 'ch_no_session' });
    const result = await guard.effect({
      type: 'CHARGE', target: 'order_1', input: {}, execute, timeoutMs: 0,
    });

    expect(result).toEqual({ id: 'ch_no_session' });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('passes receipt extractor result in commit payload', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),
      jsonResponse({ ok: true }),
    );

    const guard = makeGuard();
    await guard.start('job-1');

    await guard.effect({
      type: 'CHARGE',
      target: 'order_1',
      input: { amount: 500 },
      execute: () => Promise.resolve({ id: 'ch_receipt_test', amount: 500 }),
      receipt: (r) => ({ chargeId: r.id, amount: r.amount }),
      timeoutMs: 0,
    });

    const commitCall = mockFetch.mock.calls.find((c: any[]) =>
      (c[0] as string).includes('/effect/commit')
    );
    expect(commitCall).toBeDefined();
    const body = JSON.parse((commitCall as any[])[1].body);
    expect(body.receipt).toEqual({ chargeId: 'ch_receipt_test', amount: 500 });
  });

  it('EffectTimeoutError is instanceof-catchable and exposes fingerprint', async () => {
    mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),
      jsonResponse({ ok: true }),
    );

    const guard = makeGuard();
    await guard.start('job-1');

    let caught: unknown;
    try {
      await guard.effect({
        type: 'SLOW_OP', target: 'resource_1', input: {},
        execute: () => new Promise<never>(() => {}),
        timeoutMs: 50,
      });
    } catch (e) {
      caught = e;
    }

    await new Promise(r => setTimeout(r, 20));
    expect(caught).toBeInstanceOf(EffectTimeoutError);
    expect((caught as EffectTimeoutError).fingerprint).toBeDefined();
    expect(typeof (caught as EffectTimeoutError).fingerprint).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// guard.wrap() shim regression tests
// Part 1: Same mock call sequence as before (contract parity)
// ─────────────────────────────────────────────────────────────────────────────

describe('guard.wrap() shim — mock call sequence regression', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('calls /effect/begin then /effect/commit (EXECUTE path) — same net effect as old verify+reportResult', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),     // begin (was: verify check)
      jsonResponse({ ok: true }),              // commit (was: verify reportResult)
    );

    const guard = makeGuard();
    await guard.start('job-wrap-1');

    const result = await guard.wrap('EMAIL', 'user@test.com', { subject: 'Hi' }, async () => 'sent');

    expect(result).toBe('sent');
    expect(mockFetch).toHaveBeenCalledTimes(3);

    const [, beginCall, commitCall] = mockFetch.mock.calls;
    expect(beginCall[0]).toContain('/effect/begin');
    expect(commitCall[0]).toContain('/effect/commit');
  });

  it('returns cachedResult on SKIP without calling execute (same as before)', async () => {
    mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'SKIP', cachedResult: 'already-sent' }),
    );

    const guard = makeGuard();
    await guard.start('job-wrap-2');
    const execute = vi.fn();

    const result = await guard.wrap('EMAIL', 'user@test.com', { subject: 'Hi' }, execute);

    expect(result).toBe('already-sent');
    expect(execute).not.toHaveBeenCalled();
  });

  it('re-throws operation errors (same as before)', async () => {
    mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),
      jsonResponse({ ok: true }),  // unknown/failed
    );

    const guard = makeGuard();
    await guard.start('job-wrap-3');

    await expect(
      guard.wrap('EMAIL', 'user@test.com', {}, () => Promise.reject(new Error('SMTP down')))
    ).rejects.toThrow('SMTP down');
  });

  it('passes scope parameter through (PROJECT scope)', async () => {
    const mockFetch = mockFetchSequence(
      sessionResponse(),
      jsonResponse({ action: 'EXECUTE' }),
      jsonResponse({ ok: true }),
    );

    const guard = makeGuard();
    await guard.start('job-wrap-4');
    await guard.wrap('EMAIL', 'user@test.com', {}, async () => 'ok', 'PROJECT');

    const beginBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(beginBody.scope).toBe('PROJECT');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// guard.start() — Phase 6: workflowId and agentId
// ─────────────────────────────────────────────────────────────────────────────

describe('guard.start() — workflowId and agentId', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('sends workflowId and agentId to session API', async () => {
    const mockFetch = mockFetchSequence(sessionResponse());
    const guard = makeGuard();
    await guard.start('job-1', 'workflow_abc', 'agent_xyz');

    const sessionBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sessionBody.workflowId).toBe('workflow_abc');
    expect(sessionBody.agentId).toBe('agent_xyz');
  });

  it('sends null for workflowId and agentId when not provided', async () => {
    const mockFetch = mockFetchSequence(sessionResponse());
    const guard = makeGuard();
    await guard.start('job-2');

    const sessionBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sessionBody.workflowId).toBeNull();
    expect(sessionBody.agentId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Existing tests that must still pass (regression suite)
// ─────────────────────────────────────────────────────────────────────────────

describe('ReplayGuard SDK (existing tests — must not regress)', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  describe('Fingerprinting (Input Hashing)', () => {
    it('should ignore default transient keys by default', () => {
      const guard = makeGuard();
      const inputs1 = { amount: 100, currency: 'USD', timestamp: 1620000000000, requestId: 'req_abc', createdAt: '2026-05-20T10:00:00Z' };
      const inputs2 = { amount: 100, currency: 'USD', timestamp: 1630000000000, requestId: 'req_xyz', createdAt: '2026-05-20T11:00:00Z' };
      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);
      expect(hash1).toBe(hash2);
    });

    it('should support custom ignore keys', () => {
      const guard = makeGuard({ ignoreKeys: ['customField'] });
      const hash1 = (guard as any)._buildInputHash({ amount: 100, customField: 'foo' });
      const hash2 = (guard as any)._buildInputHash({ amount: 100, customField: 'bar' });
      expect(hash1).toBe(hash2);
    });

    it('should not ignore default keys if disableDefaultIgnoreKeys is true', () => {
      const guard = makeGuard({ disableDefaultIgnoreKeys: true });
      const hash1 = (guard as any)._buildInputHash({ amount: 100, timestamp: 1620000000000 });
      const hash2 = (guard as any)._buildInputHash({ amount: 100, timestamp: 1630000000000 });
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Network Resilience', () => {
    it('should retry on fetch failure', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network failure 1'))
        .mockRejectedValueOnce(new Error('Network failure 2'))
        .mockResolvedValueOnce(jsonResponse({ executionId: 'exec_123', attempt: 1, token: 'token_123' }));
      vi.stubGlobal('fetch', mockFetch);

      const guard = new ReplayGuard({ apiKey: 'sk_test_123', monitorId: 'monitor_123', network: { maxRetries: 3, baseDelayMs: 1 } });
      const context = await guard.start('ext-id-1');
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(context?.executionId).toBe('exec_123');
    });

    it('should fail-policy OPEN on exhaustion', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Persistent outage')));
      const guard = new ReplayGuard({ apiKey: 'sk_test_123', monitorId: 'monitor_123', failPolicy: 'OPEN', network: { maxRetries: 2, baseDelayMs: 1 } });
      const context = await guard.start('ext-id-1');
      expect(context).toBeNull();
      const result = await guard.verify('type', 'target', {});
      expect(result.action).toBe('EXECUTE');
    });

    it('should fail-policy CLOSED on exhaustion', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Persistent outage')));
      const guard = new ReplayGuard({ apiKey: 'sk_test_123', monitorId: 'monitor_123', failPolicy: 'CLOSED', network: { maxRetries: 2, baseDelayMs: 1 } });
      await expect(guard.start('ext-id-1')).rejects.toThrow('Persistent outage');
    });
  });

  describe('Feature Enhancements (Issues 1-4)', () => {
    it('should compute fingerprint publicly', () => {
      const guard = makeGuard();
      const fp = guard.fingerprint('TEST_TYPE', 'test_target', { value: 42 });
      expect(fp).toBeDefined();
      expect(typeof fp).toBe('string');
    });

    it('should expose fingerprint in VerifyResponse', async () => {
      const guard = makeGuard();
      const res = await guard.verify('TEST_TYPE', 'test_target', { value: 42 });
      expect(res.fingerprint).toBeDefined();
      expect(res.fingerprint).toBe(guard.fingerprint('TEST_TYPE', 'test_target', { value: 42 }));
    });

    it('should inject Idempotency-Key header in guard.fetch()', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
      vi.stubGlobal('fetch', mockFetch);
      const guard = makeGuard();
      await guard.fetch('https://api.stripe.com/v1/charges', { method: 'POST', body: JSON.stringify({ amount: 100 }) });
      expect(mockFetch).toHaveBeenCalled();
      const lastCallArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const headers = lastCallArgs[1]?.headers;
      const hasKey = headers && (headers['Idempotency-Key'] || headers.get?.('Idempotency-Key'));
      expect(hasKey).toBeTruthy();
    });

    it('should support stripe() semantic adapter', async () => {
      const guard = makeGuard();
      const result = await guard.stripe<{ id: string }>('operation_123', { amount: 50 }, async () => ({ id: 'ch_123' }));
      expect(result.id).toBe('ch_123');
    });
  });
});
