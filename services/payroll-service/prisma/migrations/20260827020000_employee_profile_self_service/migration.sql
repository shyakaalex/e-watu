ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "emergency_contact_name" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" TEXT;

CREATE TABLE IF NOT EXISTS "employee_documents" (
  "id"          TEXT         NOT NULL,
  "tenant_id"   TEXT         NOT NULL,
  "employee_id" TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "s3_key"      TEXT         NOT NULL,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "employee_documents_tenant_id_idx" ON "employee_documents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "employee_documents_employee_id_idx" ON "employee_documents" ("employee_id");

ALTER TABLE "employee_documents"
  DROP CONSTRAINT IF EXISTS "employee_documents_employee_id_fkey",
  ADD CONSTRAINT "employee_documents_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
