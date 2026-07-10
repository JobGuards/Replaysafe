-- Phase 7: Verification Engine
-- Adds verifiedAt timestamp to GuardSideEffect and creates ProjectProviderConfig table

-- AlterTable: add verifiedAt to GuardSideEffect
ALTER TABLE "GuardSideEffect" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- CreateTable: ProjectProviderConfig
CREATE TABLE "ProjectProviderConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProviderConfig_projectId_provider_key" ON "ProjectProviderConfig"("projectId", "provider");

-- CreateIndex
CREATE INDEX "ProjectProviderConfig_projectId_idx" ON "ProjectProviderConfig"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectProviderConfig" ADD CONSTRAINT "ProjectProviderConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
