ALTER TABLE "leave_requests"
  ADD COLUMN IF NOT EXISTS "attachment_s3_key" TEXT,
  ADD COLUMN IF NOT EXISTS "delegate_to_employee_id" TEXT,
  ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;

DO $$ BEGIN
  ALTER TABLE "leave_requests"
    ADD CONSTRAINT "leave_requests_delegate_to_employee_id_fkey"
    FOREIGN KEY ("delegate_to_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "security_audit_logs" ADD COLUMN IF NOT EXISTS "ip_address" TEXT;

-- Correct leave-type defaults to match the HR spec (only where still at the old, un-customized default)
UPDATE "leave_types" SET "default_days" = 22 WHERE "code" = 'ANNUAL' AND "default_days" = 18;
UPDATE "leave_types" SET "default_days" = 10 WHERE "code" = 'SICK' AND "default_days" = 15;
