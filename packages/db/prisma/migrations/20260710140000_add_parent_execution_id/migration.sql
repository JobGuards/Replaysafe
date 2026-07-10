-- Add parentExecutionId field for execution-level fork tracing
ALTER TABLE "GuardSideEffect" ADD COLUMN "parentExecutionId" TEXT;
CREATE INDEX "GuardSideEffect_parentExecutionId_idx" ON "GuardSideEffect"("parentExecutionId");