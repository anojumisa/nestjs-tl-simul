-- Step 16 — tabel `lessons` + FK ke `courses` (untuk jalur PostgreSQL raw / Step 14).
-- Jika kamu memakai Prisma migrations saja, file ini bersifat opsional (DDL sudah di `prisma/migrations/`).

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE ON UPDATE CASCADE,
  title VARCHAR(200) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lessons_course_id_idx ON lessons (course_id);
