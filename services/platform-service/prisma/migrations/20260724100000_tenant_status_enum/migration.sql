DO $$ BEGIN
  CREATE TYPE "TenantStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Rename the legacy status value before converting the column type
UPDATE "Tenant" SET "status" = 'PENDING_ACTIVATION' WHERE "status" = 'PENDING_APPROVAL';

ALTER TABLE "Tenant"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "TenantStatus" USING ("status"::text::"TenantStatus"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING_ACTIVATION';
