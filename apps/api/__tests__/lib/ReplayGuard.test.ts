import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReplayGuard } from '../../../../packages/guard-sdk/src/index.ts';

describe('ReplayGuard SDK', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Fingerprinting (Input Hashing)', () => {
    it('should ignore default transient keys by default', () => {
      const guard = new ReplayGuard({
        apiKey: 'sk_test_123',
        monitorId: 'monitor_123',
      });

      const inputs1 = {
        amount: 100,
        currency: 'USD',
        timestamp: 1620000000000,
        requestId: 'req_abc',
        createdAt: '2026-05-20T10:00:00Z',
      };

      const inputs2 = {
        amount: 100,
        currency: 'USD',
        timestamp: 1630000000000, // different timestamp
        requestId: 'req_xyz',       // different request ID
        createdAt: '2026-05-20T11:00:00Z', // different createdAt
      };

      // Since the transient keys are stripped by default, both hashes must match
      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);

      expect(hash1).toBe(hash2);
    });

    it('should support custom ignore keys', () => {
      const guard = new ReplayGuard({
        apiKey: 'sk_test_123',
        monitorId: 'monitor_123',
        ignoreKeys: ['customField'],
      });

      const inputs1 = { amount: 100, customField: 'foo' };
      const inputs2 = { amount: 100, customField: 'bar' };

      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);

      expect(hash1).toBe(hash2);
    });

    it('should not ignore default keys if disableDefaultIgnoreKeys is true', () => {
      const guard = new ReplayGuard({
        apiKey: 'sk_test_123',
        monitorId: 'monitor_123',
        disableDefaultIgnoreKeys: true,
      });

      const inputs1 = { amount: 100, timestamp: 1620000000000 };
      const inputs2 = { amount: 100, timestamp: 1630000000000 };

      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Network Resilience', () => {
    it('should retry on fetch failure', async () => {
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network failure 1'))
        .mockRejectedValueOnce(new Error('Network failure 2'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ executionId: 'exec_123', attempt: 1, token: 'token_123' }),
        });

      vi.stubGlobal('fetch', mockFetch);

      const guard = new ReplayGuard({
        apiKey: 'sk_test_123',
        monitorId: 'monitor_123',
        network: {
          maxRetries: 3,
          baseDelayMs: 1, // fast delay for test execution
        },
      });

      // Call start method
      const context = await guard.start('ext-id-1');
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(context).toBeDefined();
      expect(context?.executionId).toBe('exec_123');
    });

    it('should fail-policy OPEN on exhaustion', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Persistent outage'));
      vi.stubGlobal('fetch', mockFetch);

      const guard = new ReplayGuard({
        apiKey: 'sk_test_123',
        monitorId: 'monitor_123',
        failPolicy: 'OPEN',
        network: {
          maxRetries: 2,
          baseDelayMs: 1,
        },
      });

      // Under OPEN fail policy, if the backend fails to connect, start returns null
      const context = await guard.start('ext-id-1');
      expect(context).toBeNull();

      // Subsequent verify call must default to EXECUTE
      const result = await guard.verify('type', 'target', {});
      expect(result.action).toBe('EXECUTE');
    });

    it('should fail-policy CLOSED on exhaustion', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Persistent outage'));
      vi.stubGlobal('fetch', mockFetch);

      const guard = new ReplayGuard({
        apiKey: 'sk_test_123',
        monitorId: 'monitor_123',
        failPolicy: 'CLOSED',
        network: {
          maxRetries: 2,
          baseDelayMs: 1,
        },
      });

      // Under CLOSED fail policy, we should throw the connection error
      await expect(guard.start('ext-id-1')).rejects.toThrow('Persistent outage');
    });
  });
});
