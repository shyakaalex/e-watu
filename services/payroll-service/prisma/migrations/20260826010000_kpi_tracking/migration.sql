-- Add new enums
DO $$ BEGIN
  CREATE TYPE "GoalType" AS ENUM ('GOAL','KPI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "KpiPeriodStatus" AS ENUM ('DRAFT','ACTIVE','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TeamKpiStatus" AS ENUM ('DRAFT','SUBMITTED','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create kpi_periods
CREATE TABLE IF NOT EXISTS "kpi_periods" (
  "id"         TEXT              NOT NULL,
  "tenant_id"  TEXT              NOT NULL,
  "name"       TEXT              NOT NULL,
  "start_date" TIMESTAMP(3)      NOT NULL,
  "end_date"   TIMESTAMP(3)      NOT NULL,
  "status"     "KpiPeriodStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kpi_periods_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "kpi_periods_tenant_id_idx" ON "kpi_periods" ("tenant_id");

-- Extend goals for KPI use (Personal KPI reuses the Goal model rather than a parallel table)
ALTER TABLE "goals" ALTER COLUMN "appraisal_cycle_id" DROP NOT NULL;
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "type" "GoalType" NOT NULL DEFAULT 'GOAL';
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "kpi_period_id" TEXT;

CREATE INDEX IF NOT EXISTS "goals_tenant_id_type_kpi_period_id_idx" ON "goals" ("tenant_id", "type", "kpi_period_id");

ALTER TABLE "goals"
  DROP CONSTRAINT IF EXISTS "goals_kpi_period_id_fkey",
  ADD CONSTRAINT "goals_kpi_period_id_fkey"
    FOREIGN KEY ("kpi_period_id") REFERENCES "kpi_periods"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create team_kpi_submissions (the "team leader arranges the team KPI and sends it up" step)
CREATE TABLE IF NOT EXISTS "team_kpi_submissions" (
  "id"                 TEXT            NOT NULL,
  "tenant_id"          TEXT            NOT NULL,
  "team_leader_id"     TEXT            NOT NULL,
  "kpi_period_id"      TEXT            NOT NULL,
  "status"             "TeamKpiStatus" NOT NULL DEFAULT 'DRAFT',
  "member_count"       INTEGER         NOT NULL DEFAULT 0,
  "approved_kpi_count" INTEGER         NOT NULL DEFAULT 0,
  "avg_progress"       DECIMAL(5,2)    NOT NULL DEFAULT 0.0,
  "summary"            TEXT,
  "submitted_at"       TIMESTAMP(3),
  "reviewer_id"        TEXT,
  "reviewed_at"        TIMESTAMP(3),
  "review_comment"     TEXT,
  "created_at"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_kpi_submissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "team_kpi_submissions_tenant_id_idx" ON "team_kpi_submissions" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_kpi_submissions_team_leader_id_kpi_period_id_key"
  ON "team_kpi_submissions" ("team_leader_id", "kpi_period_id");

ALTER TABLE "team_kpi_submissions"
  DROP CONSTRAINT IF EXISTS "team_kpi_submissions_kpi_period_id_fkey",
  ADD CONSTRAINT "team_kpi_submissions_kpi_period_id_fkey"
    FOREIGN KEY ("kpi_period_id") REFERENCES "kpi_periods"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
