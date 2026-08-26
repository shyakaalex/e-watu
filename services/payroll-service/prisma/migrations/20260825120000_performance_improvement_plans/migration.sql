-- Add new enum
DO $$ BEGIN
  CREATE TYPE "PipStatus" AS ENUM ('ACTIVE','EXTENDED','SUCCEEDED','ESCALATED','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create performance_improvement_plans
CREATE TABLE IF NOT EXISTS "performance_improvement_plans" (
  "id"               TEXT        NOT NULL,
  "tenant_id"        TEXT        NOT NULL,
  "employee_id"      TEXT        NOT NULL,
  "appraisal_id"     TEXT,
  "manager_id"       TEXT,
  "reason"           TEXT        NOT NULL,
  "objectives"       TEXT        NOT NULL,
  "support_provided" TEXT,
  "start_date"       TIMESTAMP(3) NOT NULL,
  "review_date"      TIMESTAMP(3) NOT NULL,
  "end_date"         TIMESTAMP(3),
  "status"           "PipStatus" NOT NULL DEFAULT 'ACTIVE',
  "outcome"          TEXT,
  "created_by"       TEXT,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "performance_improvement_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "performance_improvement_plans_tenant_id_idx"        ON "performance_improvement_plans" ("tenant_id");
CREATE INDEX IF NOT EXISTS "performance_improvement_plans_tenant_id_status_idx" ON "performance_improvement_plans" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "performance_improvement_plans_employee_id_idx"      ON "performance_improvement_plans" ("employee_id");

ALTER TABLE "performance_improvement_plans"
  DROP CONSTRAINT IF EXISTS "performance_improvement_plans_employee_id_fkey",
  ADD CONSTRAINT "performance_improvement_plans_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "performance_improvement_plans"
  DROP CONSTRAINT IF EXISTS "performance_improvement_plans_appraisal_id_fkey",
  ADD CONSTRAINT "performance_improvement_plans_appraisal_id_fkey"
    FOREIGN KEY ("appraisal_id") REFERENCES "appraisals"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create pip_check_ins (progress log)
CREATE TABLE IF NOT EXISTS "pip_check_ins" (
  "id"         TEXT        NOT NULL,
  "pip_id"     TEXT        NOT NULL,
  "note"       TEXT        NOT NULL,
  "status"     TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pip_check_ins_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "pip_check_ins_pip_id_idx" ON "pip_check_ins" ("pip_id");

ALTER TABLE "pip_check_ins"
  DROP CONSTRAINT IF EXISTS "pip_check_ins_pip_id_fkey",
  ADD CONSTRAINT "pip_check_ins_pip_id_fkey"
    FOREIGN KEY ("pip_id") REFERENCES "performance_improvement_plans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
