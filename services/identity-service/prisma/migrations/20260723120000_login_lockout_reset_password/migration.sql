ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_expires_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "users_reset_password_token_hash_key" ON "users"("reset_password_token_hash");
