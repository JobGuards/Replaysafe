import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReplayGuard } from "../../../../packages/guard-sdk/src/index.ts";

describe("ReplayGuard SDK", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Fingerprinting (Input Hashing)", () => {
    it("should ignore default transient keys by default", () => {
      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
      });

      const inputs1 = {
        amount: 100,
        currency: "USD",
        timestamp: 1620000000000,
        requestId: "req_abc",
        createdAt: "2026-05-20T10:00:00Z",
      };

      const inputs2 = {
        amount: 100,
        currency: "USD",
        timestamp: 1630000000000, // different timestamp
        requestId: "req_xyz", // different request ID
        createdAt: "2026-05-20T11:00:00Z", // different createdAt
      };

      // Since the transient keys are stripped by default, both hashes must match
      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);

      expect(hash1).toBe(hash2);
    });

    it("should support custom ignore keys", () => {
      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
        ignoreKeys: ["customField"],
      });

      const inputs1 = { amount: 100, customField: "foo" };
      const inputs2 = { amount: 100, customField: "bar" };

      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);

      expect(hash1).toBe(hash2);
    });

    it("should not ignore default keys if disableDefaultIgnoreKeys is true", () => {
      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
        disableDefaultIgnoreKeys: true,
      });

      const inputs1 = { amount: 100, timestamp: 1620000000000 };
      const inputs2 = { amount: 100, timestamp: 1630000000000 };

      const hash1 = (guard as any)._buildInputHash(inputs1);
      const hash2 = (guard as any)._buildInputHash(inputs2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Network Resilience", () => {
    it("should retry on fetch failure", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network failure 1"))
        .mockRejectedValueOnce(new Error("Network failure 2"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            executionId: "exec_123",
            attempt: 1,
            token: "token_123",
          }),
        });

      vi.stubGlobal("fetch", mockFetch);

      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
        network: {
          maxRetries: 3,
          baseDelayMs: 1, // fast delay for test execution
        },
      });

      // Call start method
      const context = await guard.start("ext-id-1");

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(context).toBeDefined();
      expect(context?.executionId).toBe("exec_123");
    });

    it("should fail-policy OPEN on exhaustion", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Persistent outage"));
      vi.stubGlobal("fetch", mockFetch);

      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
        failPolicy: "OPEN",
        network: {
          maxRetries: 2,
          baseDelayMs: 1,
        },
      });

      // Under OPEN fail policy, if the backend fails to connect, start returns null
      const context = await guard.start("ext-id-1");
      expect(context).toBeNull();

      // Subsequent verify call must default to EXECUTE
      const result = await guard.verify("type", "target", {});
      expect(result.action).toBe("EXECUTE");
    });

    it("should fail-policy CLOSED on exhaustion", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Persistent outage"));
      vi.stubGlobal("fetch", mockFetch);

      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
        failPolicy: "CLOSED",
        network: {
          maxRetries: 2,
          baseDelayMs: 1,
        },
      });

      // Under CLOSED fail policy, we should throw the connection error
      await expect(guard.start("ext-id-1")).rejects.toThrow(
        "Persistent outage",
      );
    });
  });

  describe("Feature Enhancements (Issues 1-4)", () => {
    it("should compute fingerprint publically", () => {
      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
      });

      const fp = guard.fingerprint("TEST_TYPE", "test_target", { value: 42 });
      expect(fp).toBeDefined();
      expect(typeof fp).toBe("string");
    });

    it("should expose fingerprint in VerifyResponse", async () => {
      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
      });

      const res = await guard.verify("TEST_TYPE", "test_target", { value: 42 });
      expect(res.fingerprint).toBeDefined();
      expect(res.fingerprint).toBe(
        guard.fingerprint("TEST_TYPE", "test_target", { value: 42 }),
      );
    });

    it("should inject Idempotency-Key header in guard.fetch()", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
      });

      await guard.fetch("https://api.stripe.com/v1/charges", {
        method: "POST",
        body: JSON.stringify({ amount: 100 }),
      });

      // Verification fetch call happened first (if session exists, but here no session so it failed open)
      // The second call is the actual outbound fetch. Let's check it:
      expect(mockFetch).toHaveBeenCalled();
      const lastCallArgs =
        mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const headers = lastCallArgs[1]?.headers;

      const hasKey =
        headers &&
        (headers["Idempotency-Key"] || headers.get?.("Idempotency-Key"));
      expect(hasKey).toBeTruthy();
    });

    it("should support stripe() semantic adapter", async () => {
      const guard = new ReplayGuard({
        apiKey: "sk_test_123",
        monitorId: "monitor_123",
      });

      const result = await guard.stripe<{ id: string }>(
        "operation_123",
        { amount: 50 },
        async () => ({ id: "ch_123" }),
      );

      expect(result.id).toBe("ch_123");
    });
  });
});
