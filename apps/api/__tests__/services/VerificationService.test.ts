import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────────────────────
// NOTE: vi.mock factories are hoisted to the top of the file by vitest.
// Variables declared with let/const in test scope are NOT available inside
// vi.mock factories. Use vi.fn() inline, then access via the imported mock.

vi.mock("@replaysafe/db", () => ({
  prisma: {
    guardSideEffect: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    guardExecution: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
    projectProviderConfig: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/services/AlertService.ts", () => ({
  alertService: { sendEmergencyAlert: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("../../src/services/verifiers/VerifierRegistry.ts", () => ({
  verifierRegistry: { verify: vi.fn(), register: vi.fn() },
}));

vi.mock("../../src/services/verifiers/StripeVerifier.ts", () => ({
  StripeVerifier: class {},
}));
vi.mock("../../src/services/verifiers/SendGridVerifier.ts", () => ({
  SendGridVerifier: class {},
}));
vi.mock("../../src/services/verifiers/GitHubVerifier.ts", () => ({
  GitHubVerifier: class {},
}));
vi.mock("../../src/services/verifiers/SlackVerifier.ts", () => ({
  SlackVerifier: class {},
}));
vi.mock("../../src/services/verifiers/TwilioVerifier.ts", () => ({
  TwilioVerifier: class {},
}));
vi.mock("../../src/services/verifiers/S3Verifier.ts", () => ({
  S3Verifier: class {},
}));
vi.mock("../../src/utils/encryption.ts", () => ({
  decryptJSON: (v: any) => (typeof v === "string" ? JSON.parse(v) : v),
}));

// ─── Imports (after mock declarations) ───────────────────────────────────────
import { prisma } from "@replaysafe/db";
import { alertService } from "../../src/services/AlertService.ts";
import { verifierRegistry } from "../../src/services/verifiers/VerifierRegistry.ts";
import { VerificationService } from "../../src/services/VerificationService.ts";

// Typed accessors for the mocked fns
const mockGuardSideEffect = vi.mocked(prisma.guardSideEffect);
const mockGuardExecution = vi.mocked(prisma.guardExecution);
const mockProjectProviderConfig = (prisma as any).projectProviderConfig;
const mockSendEmergencyAlert = vi.mocked(alertService.sendEmergencyAlert);
const mockRegistryVerify = vi.mocked(verifierRegistry.verify);

// Helper: create a mock effect
function makeEffect(overrides: Partial<any> = {}): any {
  return {
    id: "effect-1",
    type: "STRIPE_CHARGE",
    provider: "stripe",
    receipt: { chargeId: "ch_123" },
    fingerprint: "fp-abc",
    target: "order-1",
    executionId: "exec-1",
    metadata: {},
    finishedAt: new Date(Date.now() - 60_000),
    ...overrides,
  };
}

describe("VerificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty provider configs
    mockProjectProviderConfig.findMany.mockResolvedValue([]);
  });

  describe("runProjectPass", () => {
    it("returns zeroes when no UNKNOWN effects exist", async () => {
      mockGuardSideEffect.findMany.mockResolvedValueOnce([]);
      const result = await VerificationService.runProjectPass("proj-1");
      expect(result).toEqual({ verified: 0, failed: 0, unknown: 0, total: 0 });
    });

    it("marks effect as VERIFIED and calls update", async () => {
      const effect = makeEffect();
      mockGuardSideEffect.findMany.mockResolvedValueOnce([effect]);
      mockRegistryVerify.mockResolvedValue({ status: "VERIFIED" });
      mockGuardSideEffect.update.mockResolvedValue({} as any);

      const result = await VerificationService.runProjectPass("proj-1");

      expect(result.verified).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockGuardSideEffect.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "effect-1" },
          data: expect.objectContaining({ status: "VERIFIED" }),
        }),
      );
    });

    it("marks effect as FAILED and sends emergency alert", async () => {
      const effect = makeEffect();
      mockGuardSideEffect.findMany.mockResolvedValueOnce([effect]);
      mockRegistryVerify.mockResolvedValue({
        status: "FAILED",
        failureType: "SEMANTIC",
      });
      mockGuardSideEffect.update.mockResolvedValue({} as any);
      mockGuardExecution.findUnique.mockResolvedValue({
        id: "exec-1",
        monitor: { id: "mon-1", name: "Test Monitor" },
      } as any);

      const result = await VerificationService.runProjectPass("proj-1");

      expect(result.failed).toBe(1);
      expect(mockGuardSideEffect.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "effect-1" },
          data: expect.objectContaining({
            status: "FAILED",
            failureType: "SEMANTIC",
          }),
        }),
      );
      expect(mockSendEmergencyAlert).toHaveBeenCalledWith(
        "proj-1",
        "mon-1",
        "SIDE_EFFECT_VERIFICATION_FAILED",
        expect.stringContaining("Permanently Failed"),
      );
    });

    it("does not update when verifier returns UNKNOWN", async () => {
      const effect = makeEffect();
      mockGuardSideEffect.findMany.mockResolvedValueOnce([effect]);
      mockRegistryVerify.mockResolvedValue({ status: "UNKNOWN" });

      const result = await VerificationService.runProjectPass("proj-1");

      expect(result.unknown).toBe(1);
      expect(mockGuardSideEffect.update).not.toHaveBeenCalled();
    });

    it("sets verifiedAt timestamp on VERIFIED outcome", async () => {
      const effect = makeEffect();
      mockGuardSideEffect.findMany.mockResolvedValueOnce([effect]);
      mockRegistryVerify.mockResolvedValue({ status: "VERIFIED" });
      mockGuardSideEffect.update.mockResolvedValue({} as any);

      await VerificationService.runProjectPass("proj-1");

      const updateCall = mockGuardSideEffect.update.mock.calls[0][0] as any;
      expect(updateCall.data.verifiedAt).toBeInstanceOf(Date);
    });
  });

  describe("runExecutionPass", () => {
    it("throws when execution does not belong to project", async () => {
      mockGuardExecution.findUnique.mockResolvedValue({
        id: "exec-1",
        monitor: { projectId: "other-project" },
      } as any);

      await expect(
        VerificationService.runExecutionPass("exec-1", "proj-1"),
      ).rejects.toThrow("not found or access denied");
    });

    it("returns zeroes when no UNKNOWN effects", async () => {
      mockGuardExecution.findUnique.mockResolvedValue({
        id: "exec-1",
        monitor: { projectId: "proj-1" },
      } as any);
      mockGuardSideEffect.findMany.mockResolvedValueOnce([]);

      const result = await VerificationService.runExecutionPass(
        "exec-1",
        "proj-1",
      );
      expect(result.total).toBe(0);
    });
  });
});
