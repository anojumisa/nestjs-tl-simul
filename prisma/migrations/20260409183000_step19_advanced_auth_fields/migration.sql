-- Step 19: advanced authentication fields for account protection and refresh tokens
ALTER TABLE "users"
ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lock_until" TIMESTAMP(3),
ADD COLUMN "refresh_token_hash" TEXT,
ADD COLUMN "refresh_token_expires_at" TIMESTAMP(3);
