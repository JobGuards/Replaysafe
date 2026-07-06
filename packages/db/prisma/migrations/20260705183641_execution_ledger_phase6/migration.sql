/*
  Warnings:

  - The `status` column on the `GuardSideEffect` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SideEffectStatus" AS ENUM ('INTENDED', 'EXECUTING', 'COMMITTED', 'VERIFIED', 'UNKNOWN', 'FAILED', 'COMPENSATED', 'SKIPPED');

-- AlterTable
ALTER TABLE "GuardExecution" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "workflowId" TEXT;

-- AlterTable
ALTER TABLE "GuardSideEffect" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "parentSideEffectId" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "receipt" JSONB,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "workflowId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "SideEffectStatus" NOT NULL DEFAULT 'COMMITTED';

-- CreateIndex
CREATE INDEX "GuardExecution_workflowId_idx" ON "GuardExecution"("workflowId");

-- CreateIndex
CREATE INDEX "GuardExecution_agentId_idx" ON "GuardExecution"("agentId");

-- CreateIndex
CREATE INDEX "GuardSideEffect_workflowId_idx" ON "GuardSideEffect"("workflowId");

-- CreateIndex
CREATE INDEX "GuardSideEffect_agentId_idx" ON "GuardSideEffect"("agentId");

-- CreateIndex
CREATE INDEX "GuardSideEffect_status_idx" ON "GuardSideEffect"("status");

-- CreateIndex
CREATE INDEX "GuardSideEffect_projectId_status_idx" ON "GuardSideEffect"("projectId", "status");
