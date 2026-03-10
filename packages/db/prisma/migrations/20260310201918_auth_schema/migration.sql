/*
  Warnings:

  - The values [TIMEOUT] on the enum `HeartbeatType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `organizationId` on the `AlertChannel` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `keyHash` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsedAt` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Monitor` table. All the data in the column will be lost.
  - The `scheduleType` column on the `Monitor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationMember` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[key]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventType` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `AlertChannel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Monitor` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('CRON', 'SIMPLE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChannelType" ADD VALUE 'SLACK';
ALTER TYPE "ChannelType" ADD VALUE 'DISCORD';
ALTER TYPE "ChannelType" ADD VALUE 'TELEGRAM';

-- AlterEnum
BEGIN;
CREATE TYPE "HeartbeatType_new" AS ENUM ('SUCCESS', 'FAILURE');
ALTER TABLE "Heartbeat" ALTER COLUMN "type" TYPE "HeartbeatType_new" USING ("type"::text::"HeartbeatType_new");
ALTER TYPE "HeartbeatType" RENAME TO "HeartbeatType_old";
ALTER TYPE "HeartbeatType_new" RENAME TO "HeartbeatType";
DROP TYPE "HeartbeatType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "AlertChannel" DROP CONSTRAINT "AlertChannel_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "Heartbeat" DROP CONSTRAINT "Heartbeat_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "Heartbeat" DROP CONSTRAINT "Heartbeat_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "Monitor" DROP CONSTRAINT "Monitor_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- DropIndex
DROP INDEX "Alert_status_idx";

-- DropIndex
DROP INDEX "AlertChannel_organizationId_idx";

-- DropIndex
DROP INDEX "ApiKey_keyHash_key";

-- DropIndex
DROP INDEX "ApiKey_userId_idx";

-- DropIndex
DROP INDEX "Heartbeat_type_idx";

-- DropIndex
DROP INDEX "Incident_monitorId_status_idx";

-- DropIndex
DROP INDEX "Incident_status_idx";

-- DropIndex
DROP INDEX "Monitor_deletedAt_idx";

-- DropIndex
DROP INDEX "Monitor_organizationId_idx";

-- DropIndex
DROP INDEX "Monitor_status_idx";

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "AlertChannel" DROP COLUMN "organizationId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "events" TEXT[] DEFAULT ARRAY['incident.created', 'incident.resolved']::TEXT[],
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "expiresAt",
DROP COLUMN "keyHash",
DROP COLUMN "lastUsedAt",
DROP COLUMN "userId",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "lastUsed" TIMESTAMP(3),
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Heartbeat" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "outputSizeBytes" INTEGER;

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedBy" TEXT,
ADD COLUMN     "alertsSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "autoResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "lastAlertedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "organizationId",
ADD COLUMN     "alertOnLate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "healthScore" DOUBLE PRECISION,
ADD COLUMN     "notifyAfterSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "totalHeartbeats" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "scheduleType",
ADD COLUMN     "scheduleType" "ScheduleType" NOT NULL DEFAULT 'CRON';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "fullName" DROP NOT NULL;

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "OrganizationMember";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whatHappened" TEXT NOT NULL,
    "whatFixed" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[],
    "timeToResolveSeconds" INTEGER,
    "resolvedBy" TEXT,
    "incidentId" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "ResolutionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentPattern" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "patternType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "occurrenceCount" INTEGER NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "patternData" JSONB NOT NULL,
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "IncidentPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionSummary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL,
    "totalHeartbeats" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "missedCount" INTEGER NOT NULL,
    "lateCount" INTEGER NOT NULL,
    "avgDurationMs" DOUBLE PRECISION,
    "minDurationMs" DOUBLE PRECISION,
    "maxDurationMs" DOUBLE PRECISION,
    "uptimePercent" DOUBLE PRECISION NOT NULL,
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "ExecutionSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionHistory_incidentId_key" ON "ResolutionHistory"("incidentId");

-- CreateIndex
CREATE INDEX "ResolutionHistory_monitorId_idx" ON "ResolutionHistory"("monitorId");

-- CreateIndex
CREATE INDEX "ResolutionHistory_category_idx" ON "ResolutionHistory"("category");

-- CreateIndex
CREATE INDEX "IncidentPattern_monitorId_active_idx" ON "IncidentPattern"("monitorId", "active");

-- CreateIndex
CREATE INDEX "IncidentPattern_confidence_idx" ON "IncidentPattern"("confidence");

-- CreateIndex
CREATE INDEX "ExecutionSummary_monitorId_periodStart_idx" ON "ExecutionSummary"("monitorId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionSummary_monitorId_periodStart_periodType_key" ON "ExecutionSummary"("monitorId", "periodStart", "periodType");

-- CreateIndex
CREATE INDEX "Alert_status_nextRetryAt_idx" ON "Alert"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "AlertChannel_projectId_deletedAt_idx" ON "AlertChannel"("projectId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "Heartbeat_monitorId_type_idx" ON "Heartbeat"("monitorId", "type");

-- CreateIndex
CREATE INDEX "Heartbeat_deletedAt_idx" ON "Heartbeat"("deletedAt");

-- CreateIndex
CREATE INDEX "Incident_monitorId_status_deletedAt_idx" ON "Incident"("monitorId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Incident_status_deletedAt_idx" ON "Incident"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "Incident_deletedAt_idx" ON "Incident"("deletedAt");

-- CreateIndex
CREATE INDEX "Monitor_projectId_deletedAt_idx" ON "Monitor"("projectId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Heartbeat" ADD CONSTRAINT "Heartbeat_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Heartbeat" ADD CONSTRAINT "Heartbeat_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionHistory" ADD CONSTRAINT "ResolutionHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentPattern" ADD CONSTRAINT "IncidentPattern_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionSummary" ADD CONSTRAINT "ExecutionSummary_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertChannel" ADD CONSTRAINT "AlertChannel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "AlertChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
