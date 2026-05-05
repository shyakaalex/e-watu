-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "business_email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "owner_user_id" TEXT,
ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "rejection_reason" TEXT;
