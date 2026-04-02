-- Step 14 - Seed 0002
-- Seed data untuk tabel `courses`

BEGIN;

-- Paling simpel untuk lab: reset isi table dulu
DELETE FROM courses;

INSERT INTO courses (title, description)
VALUES
  ('Fundamental NestJS untuk Pemula', 'Kelas pengantar untuk memahami dasar NestJS dan REST API.'),
  ('TypeScript Lanjutan untuk Backend', 'Membahas tipe lanjutan dan praktik terbaik TypeScript di server.'),
  ('Integrasi Database dengan NestJS', 'Latihan connecting Nest + raw SQL + repository pattern.')
;

COMMIT;

