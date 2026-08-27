CREATE TABLE IF NOT EXISTS "holidays" (
  "id"         TEXT         NOT NULL,
  "tenant_id"  TEXT         NOT NULL,
  "name"       TEXT         NOT NULL,
  "month"      INTEGER      NOT NULL,
  "day"        INTEGER      NOT NULL,
  "note"       TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "holidays_tenant_id_idx" ON "holidays" ("tenant_id");
