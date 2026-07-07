import { describe, it, expect, vi, beforeEach } from "vitest";
import { StripeVerifier } from "../../../src/services/verifiers/StripeVerifier.ts";
import type { LedgerEntry } from "../../../src/services/verifiers/VerifierProvider.ts";

// Mock axios
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from "axios";
const mockedAxios = axios.get as ReturnType<typeof vi.fn>;

const baseEntry: LedgerEntry = {
  id: "effect-1",
  type: "STRIPE_CHARGE",
  provider: "stripe",
  fingerprint: "fp-abc",
  target: "order-123",
  receipt: null,
  executionId: "exec-1",
};

describe("StripeVerifier", () => {
  const verifier = new StripeVerifier();
  const config = { secretKey: "sk_test_fake" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNKNOWN when no receipt is present", async () => {
    const result = await verifier.verify({ ...baseEntry, receipt: null }, config);
    expect(result).toEqual({ status: "UNKNOWN" });
  });

  it("returns UNKNOWN when config has no secretKey", async () => {
    const result = await verifier.verify(
      { ...baseEntry, receipt: { chargeId: "ch_123" } },
      {},
    );
    expect(result).toEqual({ status: "UNKNOWN" });
  });

  it("returns VERIFIED when charge status is succeeded", async () => {
    mockedAxios.mockResolvedValueOnce({ data: { status: "succeeded" } } as any);
    const result = await verifier.verify(
      { ...baseEntry, receipt: { chargeId: "ch_abc123" } },
      config,
    );
    expect(result).toEqual({ status: "VERIFIED" });
    expect(mockedAxios).toHaveBeenCalledWith(
      expect.stringContaining("ch_abc123"),
      expect.any(Object),
    );
  });

  it("returns FAILED when charge status is failed", async () => {
    mockedAxios.mockResolvedValueOnce({ data: { status: "failed" } } as any);
    const result = await verifier.verify(
      { ...baseEntry, receipt: { chargeId: "ch_fail" } },
      config,
    );
    expect(result).toEqual({ status: "FAILED", failureType: "SEMANTIC" });
  });

  it("returns UNKNOWN for intermediate charge status", async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { status: "pending" },
    } as any);
    const result = await verifier.verify(
      { ...baseEntry, receipt: { chargeId: "ch_pending" } },
      config,
    );
    expect(result).toEqual({ status: "UNKNOWN" });
  });

  it("returns VERIFIED when paymentIntent status is succeeded", async () => {
    mockedAxios.mockResolvedValueOnce({ data: { status: "succeeded" } } as any);
    const result = await verifier.verify(
      { ...baseEntry, receipt: { paymentIntentId: "pi_abc" } },
      config,
    );
    expect(result).toEqual({ status: "VERIFIED" });
  });

  it("returns FAILED when paymentIntent status is canceled", async () => {
    mockedAxios.mockResolvedValueOnce({
      data: { status: "canceled" },
    } as any);
    const result = await verifier.verify(
      { ...baseEntry, receipt: { paymentIntentId: "pi_canceled" } },
      config,
    );
    expect(result).toEqual({ status: "FAILED", failureType: "SEMANTIC" });
  });

  it("returns FAILED on 404 API response", async () => {
    mockedAxios.mockRejectedValueOnce({ response: { status: 404 } });
    const result = await verifier.verify(
      { ...baseEntry, receipt: { chargeId: "ch_gone" } },
      config,
    );
    expect(result).toEqual({ status: "FAILED", failureType: "SEMANTIC" });
  });

  it("returns UNKNOWN on network error", async () => {
    mockedAxios.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const result = await verifier.verify(
      { ...baseEntry, receipt: { chargeId: "ch_netfail" } },
      config,
    );
    expect(result).toEqual({ status: "UNKNOWN" });
  });
});
