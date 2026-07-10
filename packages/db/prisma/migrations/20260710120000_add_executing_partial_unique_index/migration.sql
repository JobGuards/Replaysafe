-- Add partial unique index to prevent concurrent EXECUTING side effects with same fingerprint in same project
-- This ensures atomic conflict detection at the database level

CREATE UNIQUE INDEX IF NOT EXISTS "GuardSideEffect_executing_fingerprint_project_key"
ON "GuardSideEffect" ("fingerprint", "projectId")
WHERE "status" = 'EXECUTING';