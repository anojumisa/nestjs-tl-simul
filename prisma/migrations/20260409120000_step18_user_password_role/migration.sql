-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "role" VARCHAR(20) NOT NULL DEFAULT 'student';
