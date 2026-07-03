-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('HEARTBEAT', 'TUNNEL', 'CERTIFICATE');

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "Heartbeat" ADD COLUMN     "handshakeAge" INTEGER,
ADD COLUMN     "latency" INTEGER,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "resolutionCategory" TEXT;

-- AlterTable
ALTER TABLE "Monitor" ADD COLUMN     "config" JSONB,
ADD COLUMN     "publicVisibility" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regions" TEXT[] DEFAULT ARRAY['US-EAST']::TEXT[],
ADD COLUMN     "retryPolicy" JSONB,
ADD COLUMN     "selfHealing" JSONB,
ADD COLUMN     "type" "MonitorType" NOT NULL DEFAULT 'HEARTBEAT';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "userId",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "publicSlug" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "fullName",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "userId" TEXT,
    "projectId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ExecutionSummary" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "totalHeartbeats" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lateCount" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION,
    "uptimePercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailurePattern" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailurePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "patternType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "IncidentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardExecution" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "externalId" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "payloadHash" TEXT,
    "environmentHash" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GuardExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardSideEffect" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "target" TEXT,
    "inputHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "GuardSideEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardRollback" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "sideEffectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardRollback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudInterest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'pricing_page',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_idx" ON "AuditLog"("projectId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "ExecutionSummary_monitorId_date_idx" ON "ExecutionSummary"("monitorId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionSummary_monitorId_date_period_key" ON "ExecutionSummary"("monitorId", "date", "period");

-- CreateIndex
CREATE INDEX "FailurePattern_monitorId_type_idx" ON "FailurePattern"("monitorId", "type");

-- CreateIndex
CREATE INDEX "FailurePattern_monitorId_active_idx" ON "FailurePattern"("monitorId", "active");

-- CreateIndex
CREATE INDEX "IncidentGroup_createdAt_idx" ON "IncidentGroup"("createdAt");

-- CreateIndex
CREATE INDEX "GuardExecution_monitorId_status_idx" ON "GuardExecution"("monitorId", "status");

-- CreateIndex
CREATE INDEX "GuardExecution_externalId_idx" ON "GuardExecution"("externalId");

-- CreateIndex
CREATE INDEX "GuardSideEffect_projectId_fingerprint_idx" ON "GuardSideEffect"("projectId", "fingerprint");

-- CreateIndex
CREATE INDEX "GuardSideEffect_executionId_idx" ON "GuardSideEffect"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardSideEffect_executionId_fingerprint_key" ON "GuardSideEffect"("executionId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "GuardRollback_sideEffectId_key" ON "GuardRollback"("sideEffectId");

-- CreateIndex
CREATE INDEX "GuardRollback_executionId_idx" ON "GuardRollback"("executionId");

-- CreateIndex
CREATE INDEX "Incident_groupId_idx" ON "Incident"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_publicSlug_key" ON "Project"("publicSlug");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IncidentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionSummary" ADD CONSTRAINT "ExecutionSummary_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FailurePattern" ADD CONSTRAINT "FailurePattern_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardExecution" ADD CONSTRAINT "GuardExecution_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardSideEffect" ADD CONSTRAINT "GuardSideEffect_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "GuardExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardSideEffect" ADD CONSTRAINT "GuardSideEffect_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardRollback" ADD CONSTRAINT "GuardRollback_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "GuardExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardRollback" ADD CONSTRAINT "GuardRollback_sideEffectId_fkey" FOREIGN KEY ("sideEffectId") REFERENCES "GuardSideEffect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

