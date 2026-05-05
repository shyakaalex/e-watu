-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenant_id" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_verification_token" TEXT;

UPDATE "users" SET "email_verified" = true WHERE "tenant_id" IS NULL;

CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");
