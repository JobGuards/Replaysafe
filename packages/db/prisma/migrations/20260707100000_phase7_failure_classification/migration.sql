-- CreateEnum
CREATE TYPE "SideEffectFailureType" AS ENUM ('TRANSIENT', 'SEMANTIC');

-- AlterTable
ALTER TABLE "GuardSideEffect" ADD COLUMN "failureType" "SideEffectFailureType";
