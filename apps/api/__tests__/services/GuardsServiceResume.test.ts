import { describe, it, expect, vi, beforeEach } from "vitest";

// mock database
vi.mock("@replaysafe/db", () => ({
  prisma: {
    guardSideEffect: {
      findMany: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    guardExecution: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../../src/services/VerificationService.ts", () => ({
  VerificationService: {
    runWorkflowPass: vi.fn(),
  },
}));

import { prisma } from "@replaysafe/db";
import { GuardsService } from "../../src/services/GuardsService.ts";
import { VerificationService } from "../../src/services/VerificationService.ts";

const mockGuardSideEffect = vi.mocked(prisma.guardSideEffect);
const mockRunWorkflowPass = vi.mocked(VerificationService.runWorkflowPass);

describe("GuardsService — Resume & Recovery Planner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reconcileWorkflow", () => {
    it("delegates to runWorkflowPass", async () => {
      mockRunWorkflowPass.mockResolvedValueOnce({
        verified: 1,
        failed: 0,
        unknown: 0,
        total: 1,
      });
      const result = await GuardsService.reconcileWorkflow("wf-123", "proj-1");
      expect(mockRunWorkflowPass).toHaveBeenCalledWith("wf-123", "proj-1");
      expect(result.verified).toBe(1);
    });
  });

  describe("getContinuationPlan", () => {
    it("returns CAN_RESUME with empty steps if no effects exist", async () => {
      mockGuardSideEffect.findMany.mockResolvedValueOnce([]);
      const plan = await GuardsService.getContinuationPlan("wf-123", "proj-1");
      expect(plan.status).toBe("CAN_RESUME");
      expect(plan.steps).toHaveLength(0);
    });

    it("returns COMPLETED if all steps are COMMITTED or VERIFIED", async () => {
      mockGuardSideEffect.findMany.mockResolvedValueOnce([
        {
          id: "e1",
          type: "T1",
          fingerprint: "f1",
          target: "t1",
          status: "COMMITTED",
          failureType: null,
        },
        {
          id: "e2",
          type: "T2",
          fingerprint: "f2",
          target: "t2",
          status: "VERIFIED",
          failureType: null,
        },
      ] as any);
      const plan = await GuardsService.getContinuationPlan("wf-123", "proj-1");
      expect(plan.status).toBe("COMPLETED");
      expect(plan.steps[0].action).toBe("SKIP");
      expect(plan.steps[1].action).toBe("SKIP");
    });

    it("returns RETRY for TRANSIENT failure, and BLOCKED for SEMANTIC failure", async () => {
      mockGuardSideEffect.findMany.mockResolvedValueOnce([
        {
          id: "e1",
          type: "T1",
          fingerprint: "f1",
          target: "t1",
          status: "FAILED",
          failureType: "TRANSIENT",
        },
        {
          id: "e2",
          type: "T2",
          fingerprint: "f2",
          target: "t2",
          status: "FAILED",
          failureType: "SEMANTIC",
        },
      ] as any);

      const plan = await GuardsService.getContinuationPlan("wf-123", "proj-1");
      expect(plan.status).toBe("BLOCKED");
      expect(plan.steps[0].action).toBe("RETRY");
      expect(plan.steps[1].action).toBe("BLOCK");
      expect(plan.steps[1].status).toBe("AWAITING_APPROVAL");
      expect(mockGuardSideEffect.update).toHaveBeenCalledWith({
        where: { id: "e2" },
        data: { status: "AWAITING_APPROVAL" },
      });
    });
  });

  describe("approveSideEffect", () => {
    it("transitions status from AWAITING_APPROVAL to VERIFIED", async () => {
      mockGuardSideEffect.findFirst.mockResolvedValueOnce({
        id: "e1",
        status: "AWAITING_APPROVAL",
        metadata: { original: "value" },
      } as any);

      await GuardsService.approveSideEffect("e1", "proj-1");
      expect(mockGuardSideEffect.update).toHaveBeenCalledWith({
        where: { id: "e1" },
        data: expect.objectContaining({
          status: "VERIFIED",
          verifiedAt: expect.any(Date),
        }),
      });
    });

    it("throws error if side effect is not awaiting approval", async () => {
      mockGuardSideEffect.findFirst.mockResolvedValueOnce({
        id: "e1",
        status: "COMMITTED",
      } as any);

      await expect(
        GuardsService.approveSideEffect("e1", "proj-1"),
      ).rejects.toThrow("Side effect is not awaiting approval");
    });
  });
});
