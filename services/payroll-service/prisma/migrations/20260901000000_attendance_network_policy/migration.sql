CREATE TABLE IF NOT EXISTS "attendance_network_policies" (
  "id"               TEXT         NOT NULL,
  "tenant_id"        TEXT         NOT NULL,
  "enabled"          BOOLEAN      NOT NULL DEFAULT false,
  "allowed_cidrs"    TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updated_by_email" TEXT,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "attendance_network_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_network_policies_tenant_id_key" ON "attendance_network_policies" ("tenant_id");
