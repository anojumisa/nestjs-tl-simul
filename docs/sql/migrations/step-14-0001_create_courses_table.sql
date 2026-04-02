-- Step 14 - Migration 0001
-- Buat table `courses` untuk kebutuhan CRUD aplikasi NestJS

BEGIN;

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index (opsional, untuk skenario filter/search title)
CREATE INDEX IF NOT EXISTS idx_courses_title
  ON courses(title);

COMMIT;

