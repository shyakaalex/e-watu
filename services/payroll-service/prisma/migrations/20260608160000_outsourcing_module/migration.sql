-- Add new enums
DO $$ BEGIN
  CREATE TYPE "DeploymentStatus" AS ENUM ('ACTIVE','ON_LEAVE','RECALLED','TRANSFERRED','ON_BENCH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OutsourcingEmploymentType" AS ENUM ('FULL_TIME','PART_TIME','FIXED_TERM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SecondmentContractStatus" AS ENUM ('ACTIVE','EXPIRED','TERMINATED','RENEWED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enhance outsourcing_assignments with new columns
ALTER TABLE outsourcing_assignments
  ADD COLUMN IF NOT EXISTS "client_id"          TEXT,
  ADD COLUMN IF NOT EXISTS "employment_type"    "OutsourcingEmploymentType" NOT NULL DEFAULT 'FULL_TIME',
  ADD COLUMN IF NOT EXISTS "deployment_status"  "DeploymentStatus"          NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "availability_date"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notice_period_days" INTEGER NOT NULL DEFAULT 30;

-- Create secondment_contracts (full spec)
CREATE TABLE IF NOT EXISTS "secondment_contracts" (
  "id"                     TEXT        NOT NULL,
  "tenant_id"              TEXT        NOT NULL,
  "assignment_id"          TEXT        NOT NULL,
  "contract_ref"           TEXT,
  "client_name"            TEXT        NOT NULL,
  "role"                   TEXT        NOT NULL,
  "billing_rate"           DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency"               TEXT        NOT NULL DEFAULT 'RWF',
  "working_hours_per_week" INTEGER     NOT NULL DEFAULT 40,
  "notice_period_days"     INTEGER     NOT NULL DEFAULT 30,
  "governing_law"          TEXT,
  "start_date"             TIMESTAMP(3) NOT NULL,
  "end_date"               TIMESTAMP(3),
  "renewal_date"           TIMESTAMP(3),
  "status"                 "SecondmentContractStatus" NOT NULL DEFAULT 'ACTIVE',
  "termination_reason"     TEXT,
  "terminated_at"          TIMESTAMP(3),
  "terminated_by"          TEXT,
  "alert_90_sent"          BOOLEAN     NOT NULL DEFAULT FALSE,
  "alert_60_sent"          BOOLEAN     NOT NULL DEFAULT FALSE,
  "alert_30_sent"          BOOLEAN     NOT NULL DEFAULT FALSE,
  "s3_key"                 TEXT,
  "created_by"             TEXT,
  "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "secondment_contracts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "secondment_contracts_tenant_id_idx"        ON "secondment_contracts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "secondment_contracts_tenant_id_status_idx" ON "secondment_contracts" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "secondment_contracts_assignment_id_idx"    ON "secondment_contracts" ("assignment_id");
ALTER TABLE "secondment_contracts"
  DROP CONSTRAINT IF EXISTS "secondment_contracts_assignment_id_fkey",
  ADD CONSTRAINT "secondment_contracts_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "outsourcing_assignments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create contract_amendments (audit trail)
CREATE TABLE IF NOT EXISTS "contract_amendments" (
  "id"               TEXT        NOT NULL,
  "tenant_id"        TEXT        NOT NULL,
  "contract_id"      TEXT        NOT NULL,
  "changed_by"       TEXT        NOT NULL,
  "reason"           TEXT        NOT NULL,
  "changes_summary"  TEXT        NOT NULL,
  "snapshot_json"    JSONB       NOT NULL DEFAULT '{}',
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_amendments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "contract_amendments_contract_id_idx" ON "contract_amendments" ("contract_id");
ALTER TABLE "contract_amendments"
  DROP CONSTRAINT IF EXISTS "contract_amendments_contract_id_fkey",
  ADD CONSTRAINT "contract_amendments_contract_id_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "secondment_contracts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create deployment_history
CREATE TABLE IF NOT EXISTS "deployment_history" (
  "id"            TEXT        NOT NULL,
  "tenant_id"     TEXT        NOT NULL,
  "assignment_id" TEXT        NOT NULL,
  "client_name"   TEXT        NOT NULL,
  "role_name"     TEXT        NOT NULL,
  "start_date"    TIMESTAMP(3) NOT NULL,
  "end_date"      TIMESTAMP(3),
  "reason"        TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "deployment_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "deployment_history_assignment_id_idx" ON "deployment_history" ("assignment_id");
ALTER TABLE "deployment_history"
  DROP CONSTRAINT IF EXISTS "deployment_history_assignment_id_fkey",
  ADD CONSTRAINT "deployment_history_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "outsourcing_assignments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
