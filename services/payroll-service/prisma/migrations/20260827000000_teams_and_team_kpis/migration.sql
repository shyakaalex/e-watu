-- New enum
DO $$ BEGIN
  CREATE TYPE "TeamMemberRole" AS ENUM ('LEAD','CORE','MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create teams
CREATE TABLE IF NOT EXISTS "teams" (
  "id"             TEXT         NOT NULL,
  "tenant_id"      TEXT         NOT NULL,
  "name"           TEXT         NOT NULL,
  "parent_team_id" TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "teams_tenant_id_idx" ON "teams" ("tenant_id");

ALTER TABLE "teams"
  DROP CONSTRAINT IF EXISTS "teams_parent_team_id_fkey",
  ADD CONSTRAINT "teams_parent_team_id_fkey"
    FOREIGN KEY ("parent_team_id") REFERENCES "teams"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create team_members
CREATE TABLE IF NOT EXISTS "team_members" (
  "id"          TEXT             NOT NULL,
  "tenant_id"   TEXT             NOT NULL,
  "team_id"     TEXT             NOT NULL,
  "employee_id" TEXT             NOT NULL,
  "role"        "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
  "created_at"  TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_id_employee_id_key" ON "team_members" ("team_id", "employee_id");
CREATE INDEX IF NOT EXISTS "team_members_tenant_id_idx" ON "team_members" ("tenant_id");
CREATE INDEX IF NOT EXISTS "team_members_employee_id_idx" ON "team_members" ("employee_id");

ALTER TABLE "team_members"
  DROP CONSTRAINT IF EXISTS "team_members_team_id_fkey",
  ADD CONSTRAINT "team_members_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "teams"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members"
  DROP CONSTRAINT IF EXISTS "team_members_employee_id_fkey",
  ADD CONSTRAINT "team_members_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing manager/report relationship becomes a real Team, so the
-- pre-existing managerId-based data isn't silently dropped when KPI approval moves
-- from "your manager" to "your team's lead".
INSERT INTO "teams" ("id", "tenant_id", "name", "created_at", "updated_at")
SELECT gen_random_uuid(), m."tenant_id", CONCAT(m."first_name", ' ', m."last_name", E'’s Team'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "employees" m
WHERE EXISTS (SELECT 1 FROM "employees" r WHERE r."manager_id" = m."id");

INSERT INTO "team_members" ("id", "tenant_id", "team_id", "employee_id", "role", "created_at")
SELECT gen_random_uuid(), t."tenant_id", t."id", m."id", 'LEAD', CURRENT_TIMESTAMP
FROM "teams" t
JOIN "employees" m ON CONCAT(m."first_name", ' ', m."last_name", E'’s Team') = t."name" AND m."tenant_id" = t."tenant_id"
WHERE EXISTS (SELECT 1 FROM "employees" r WHERE r."manager_id" = m."id");

INSERT INTO "team_members" ("id", "tenant_id", "team_id", "employee_id", "role", "created_at")
SELECT gen_random_uuid(), t."tenant_id", t."id", r."id", 'MEMBER', CURRENT_TIMESTAMP
FROM "employees" r
JOIN "employees" m ON m."id" = r."manager_id"
JOIN "teams" t ON t."name" = CONCAT(m."first_name", ' ', m."last_name", E'’s Team') AND t."tenant_id" = m."tenant_id"
WHERE r."manager_id" IS NOT NULL;

-- Rework team_kpi_submissions to key off a real Team instead of a lone manager id
ALTER TABLE "team_kpi_submissions" ADD COLUMN IF NOT EXISTS "team_id" TEXT;

UPDATE "team_kpi_submissions" s
SET "team_id" = tm."team_id"
FROM "team_members" tm
WHERE tm."employee_id" = s."team_leader_id" AND tm."role" = 'LEAD' AND s."team_id" IS NULL;

-- Any submission whose leader had no backfilled team (shouldn't happen given the backfill
-- above, but guards against orphan rows) gets dropped rather than left with a null team_id.
DELETE FROM "team_kpi_submissions" WHERE "team_id" IS NULL;

ALTER TABLE "team_kpi_submissions" ALTER COLUMN "team_id" SET NOT NULL;

ALTER TABLE "team_kpi_submissions"
  DROP CONSTRAINT IF EXISTS "team_kpi_submissions_team_leader_id_kpi_period_id_key";
DROP INDEX IF EXISTS "team_kpi_submissions_team_leader_id_kpi_period_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "team_kpi_submissions_team_id_kpi_period_id_key" ON "team_kpi_submissions" ("team_id", "kpi_period_id");

ALTER TABLE "team_kpi_submissions"
  DROP CONSTRAINT IF EXISTS "team_kpi_submissions_team_id_fkey",
  ADD CONSTRAINT "team_kpi_submissions_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "teams"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
