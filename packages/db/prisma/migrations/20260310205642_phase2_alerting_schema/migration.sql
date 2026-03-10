/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `isLate` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `nextRetryAt` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `retryCount` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `AlertChannel` table. All the data in the column will be lost.
  - You are about to drop the column `events` on the `AlertChannel` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AlertChannel` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AlertChannel` table. All the data in the column will be lost.
  - You are about to drop the column `acknowledgedAt` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `acknowledgedBy` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `durationSeconds` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `lastAlertedAt` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the `ExecutionSummary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IncidentPattern` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResolutionHistory` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `status` on the `Alert` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `sentAt` on table `Alert` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `type` on the `AlertChannel` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Incident` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ExecutionSummary" DROP CONSTRAINT "ExecutionSummary_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "Heartbeat" DROP CONSTRAINT "Heartbeat_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentPattern" DROP CONSTRAINT "IncidentPattern_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "ResolutionHistory" DROP CONSTRAINT "ResolutionHistory_incidentId_fkey";

-- DropIndex
DROP INDEX "Alert_channelId_idx";

-- DropIndex
DROP INDEX "Alert_status_nextRetryAt_idx";

-- DropIndex
DROP INDEX "AlertChannel_projectId_deletedAt_idx";

-- DropIndex
DROP INDEX "Heartbeat_deletedAt_idx";

-- DropIndex
DROP INDEX "Heartbeat_monitorId_type_idx";

-- DropIndex
DROP INDEX "Incident_deletedAt_idx";

-- DropIndex
DROP INDEX "Incident_monitorId_status_deletedAt_idx";

-- DropIndex
DROP INDEX "Incident_startedAt_idx";

-- DropIndex
DROP INDEX "Incident_status_deletedAt_idx";

-- DropIndex
DROP INDEX "Monitor_projectId_deletedAt_idx";

-- AlterTable
ALTER TABLE "Alert" DROP COLUMN "createdAt",
DROP COLUMN "eventType",
DROP COLUMN "isLate",
DROP COLUMN "nextRetryAt",
DROP COLUMN "receivedAt",
DROP COLUMN "retryCount",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "sentAt" SET NOT NULL,
ALTER COLUMN "sentAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AlertChannel" DROP COLUMN "deletedAt",
DROP COLUMN "events",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "acknowledgedAt",
DROP COLUMN "acknowledgedBy",
DROP COLUMN "category",
DROP COLUMN "deletedAt",
DROP COLUMN "durationSeconds",
DROP COLUMN "errorMessage",
DROP COLUMN "lastAlertedAt",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- DropTable
DROP TABLE "ExecutionSummary";

-- DropTable
DROP TABLE "IncidentPattern";

-- DropTable
DROP TABLE "ResolutionHistory";

-- DropEnum
DROP TYPE "AlertStatus";

-- DropEnum
DROP TYPE "ChannelType";

-- DropEnum
DROP TYPE "IncidentStatus";

-- DropEnum
DROP TYPE "IncidentType";

-- CreateIndex
CREATE INDEX "AlertChannel_projectId_type_idx" ON "AlertChannel"("projectId", "type");

-- CreateIndex
CREATE INDEX "Incident_monitorId_startedAt_idx" ON "Incident"("monitorId", "startedAt");

-- CreateIndex
CREATE INDEX "Incident_resolvedAt_idx" ON "Incident"("resolvedAt");

-- AddForeignKey
ALTER TABLE "Heartbeat" ADD CONSTRAINT "Heartbeat_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
