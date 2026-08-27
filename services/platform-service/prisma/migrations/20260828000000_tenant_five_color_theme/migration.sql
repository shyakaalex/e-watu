-- Five-color tenant theme: primary/accent already existed, add secondary/background/text.
-- All three are optional (no default) so a tenant can pick as few as 1-2 colors and the
-- app falls back to its default dark theme for the rest.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "secondary_color" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "background_color" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "text_color" TEXT;
