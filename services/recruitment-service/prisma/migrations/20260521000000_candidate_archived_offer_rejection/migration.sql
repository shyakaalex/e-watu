-- AlterTable
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
