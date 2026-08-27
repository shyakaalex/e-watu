ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "probation_end_date" TIMESTAMP(3);

ALTER TABLE "employee_documents" ADD COLUMN IF NOT EXISTS "expiry_date" TIMESTAMP(3);

DO $$ BEGIN
  CREATE TYPE "GrievanceCategory" AS ENUM ('HARASSMENT','DISCRIMINATION','WORKPLACE_CONDITIONS','PAY_DISPUTE','POLICY_VIOLATION','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "GrievanceStatus" AS ENUM ('OPEN','INVESTIGATING','RESOLVED','DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "grievance_cases" (
  "id"                    TEXT                NOT NULL,
  "tenant_id"             TEXT                NOT NULL,
  "raised_by_employee_id" TEXT                NOT NULL,
  "category"              "GrievanceCategory" NOT NULL DEFAULT 'OTHER',
  "description"           TEXT                NOT NULL,
  "status"                "GrievanceStatus"   NOT NULL DEFAULT 'OPEN',
  "handled_by_name"       TEXT,
  "resolution_notes"      TEXT,
  "created_at"            TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at"           TIMESTAMP(3),
  CONSTRAINT "grievance_cases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "grievance_cases_tenant_id_idx" ON "grievance_cases" ("tenant_id");
CREATE INDEX IF NOT EXISTS "grievance_cases_tenant_id_status_idx" ON "grievance_cases" ("tenant_id", "status");

ALTER TABLE "grievance_cases"
  DROP CONSTRAINT IF EXISTS "grievance_cases_raised_by_employee_id_fkey",
  ADD CONSTRAINT "grievance_cases_raised_by_employee_id_fkey"
    FOREIGN KEY ("raised_by_employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ BEGIN
  CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','LATE','ABSENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id"            TEXT                NOT NULL,
  "tenant_id"     TEXT                NOT NULL,
  "employee_id"   TEXT                NOT NULL,
  "date"          DATE                NOT NULL,
  "clock_in_at"   TIMESTAMP(3),
  "clock_out_at"  TIMESTAMP(3),
  "status"        "AttendanceStatus"  NOT NULL DEFAULT 'PRESENT',
  "created_at"    TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_tenant_id_employee_id_date_key" ON "attendance_records" ("tenant_id", "employee_id", "date");
CREATE INDEX IF NOT EXISTS "attendance_records_tenant_id_idx" ON "attendance_records" ("tenant_id");
CREATE INDEX IF NOT EXISTS "attendance_records_tenant_id_date_idx" ON "attendance_records" ("tenant_id", "date");

ALTER TABLE "attendance_records"
  DROP CONSTRAINT IF EXISTS "attendance_records_employee_id_fkey",
  ADD CONSTRAINT "attendance_records_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

DO $$ BEGIN
  CREATE TYPE "TrainingRecordStatus" AS ENUM ('NOT_STARTED','IN_PROGRESS','COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "training_courses" (
  "id"          TEXT         NOT NULL,
  "tenant_id"   TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "description" TEXT,
  "mandatory"   BOOLEAN      NOT NULL DEFAULT true,
  "due_date"    TIMESTAMP(3),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "training_courses_tenant_id_idx" ON "training_courses" ("tenant_id");

CREATE TABLE IF NOT EXISTS "training_records" (
  "id"           TEXT                    NOT NULL,
  "tenant_id"    TEXT                    NOT NULL,
  "course_id"    TEXT                    NOT NULL,
  "employee_id"  TEXT                    NOT NULL,
  "status"       "TrainingRecordStatus"  NOT NULL DEFAULT 'NOT_STARTED',
  "completed_at" TIMESTAMP(3),
  "created_at"   TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "training_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "training_records_course_id_employee_id_key" ON "training_records" ("course_id", "employee_id");
CREATE INDEX IF NOT EXISTS "training_records_tenant_id_idx" ON "training_records" ("tenant_id");
CREATE INDEX IF NOT EXISTS "training_records_tenant_id_employee_id_idx" ON "training_records" ("tenant_id", "employee_id");

ALTER TABLE "training_records"
  DROP CONSTRAINT IF EXISTS "training_records_course_id_fkey",
  ADD CONSTRAINT "training_records_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "training_courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "training_records"
  DROP CONSTRAINT IF EXISTS "training_records_employee_id_fkey",
  ADD CONSTRAINT "training_records_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
