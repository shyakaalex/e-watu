-- Phase 1: tenant branding & configuration (EWatu §5.4)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "primary_color" TEXT DEFAULT '#0d9488';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "accent_color" TEXT DEFAULT '#0f766e';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "base_currency" TEXT DEFAULT 'RWF';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "fiscal_year_start_month" INTEGER DEFAULT 1;
