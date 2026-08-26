-- Add new enums
DO $$ BEGIN
  CREATE TYPE "PermitType" AS ENUM ('WORK_PERMIT','VISA','RESIDENCE_PERMIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PermitStatus" AS ENUM ('APPROVED','EXPIRED','REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ChecklistItemStatus" AS ENUM ('PENDING','UPLOADED','VERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create permits
CREATE TABLE IF NOT EXISTS "permits" (
  "id"            TEXT        NOT NULL,
  "tenant_id"     TEXT        NOT NULL,
  "employee_id"   TEXT        NOT NULL,
  "permit_number" TEXT        NOT NULL,
  "permit_type"   "PermitType" NOT NULL,
  "country"       TEXT        NOT NULL DEFAULT 'RW',
  "expiry_date"   TIMESTAMP(3) NOT NULL,
  "status"        "PermitStatus" NOT NULL DEFAULT 'APPROVED',
  "alert_90_sent" BOOLEAN     NOT NULL DEFAULT FALSE,
  "alert_60_sent" BOOLEAN     NOT NULL DEFAULT FALSE,
  "alert_30_sent" BOOLEAN     NOT NULL DEFAULT FALSE,
  "alert_7_sent"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "permits_tenant_id_idx"          ON "permits" ("tenant_id");
CREATE INDEX IF NOT EXISTS "permits_tenant_id_status_idx"   ON "permits" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "permits_employee_id_idx"        ON "permits" ("employee_id");

ALTER TABLE "permits"
  DROP CONSTRAINT IF EXISTS "permits_employee_id_fkey",
  ADD CONSTRAINT "permits_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Create permit_checklist_items
CREATE TABLE IF NOT EXISTS "permit_checklist_items" (
  "id"            TEXT        NOT NULL,
  "tenant_id"     TEXT        NOT NULL,
  "permit_id"     TEXT        NOT NULL,
  "document_name" TEXT        NOT NULL,
  "status"        "ChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
  "file_key"      TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permit_checklist_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "permit_checklist_items_permit_id_idx" ON "permit_checklist_items" ("permit_id");

ALTER TABLE "permit_checklist_items"
  DROP CONSTRAINT IF EXISTS "permit_checklist_items_permit_id_fkey",
  ADD CONSTRAINT "permit_checklist_items_permit_id_fkey"
    FOREIGN KEY ("permit_id") REFERENCES "permits"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
