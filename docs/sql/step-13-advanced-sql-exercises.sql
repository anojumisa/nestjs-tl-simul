-- Step 13 - Advanced SQL Exercises (PostgreSQL)
-- Jalankan dengan urutan:
-- 1) Setup (DDL yang dibutuhkan)
-- 2) Seed data
-- 3) Latihan query (JOIN, UNION, SUBQUERY)
-- 4) Modifying data (UPDATE/DELETE + transaction)
-- 5) Indexing + EXPLAIN ANALYZE
--
-- Catatan:
-- - Script ini mengasumsikan table dari Step 12 sudah ada:
--   `courses`, `lessons`, `students`, `enrollments`
-- - Script ini hanya menambah table `payments` dan index yang relevan.

BEGIN;

-- =========================
-- 1) Setup tambahan table
-- =========================

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optional: buat kolom is_active jika belum ada (untuk latihan UPDATE ... FROM)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'enrollments'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE enrollments
      ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

COMMIT;

-- =========================
-- 2) Seed data payments
-- =========================
-- Untuk menjaga script aman di beberapa kali run:
-- - kita kosongkan payments dulu
-- - lalu insert ulang data

BEGIN;

DELETE FROM payments;

INSERT INTO payments (student_id, course_id, amount, status, paid_at)
VALUES
  -- student 1, course 1
  (1, 1, 120000.00, 'paid', NOW() - INTERVAL '20 days'),
  (1, 1, 50000.00,  'pending', NULL),

  -- student 2, course 1
  (2, 1, 130000.00, 'paid', NOW() - INTERVAL '15 days'),
  (2, 1, 70000.00,  'failed', NOW() - INTERVAL '8 days'),

  -- student 2, course 2
  (2, 2, 90000.00,  'paid', NOW() - INTERVAL '10 days'),
  (2, 2, 25000.00,  'pending', NULL);

-- Tambahan untuk memperkaya data
INSERT INTO payments (student_id, course_id, amount, status, paid_at)
VALUES
  (3, 1, 88000.00, 'paid', NOW() - INTERVAL '7 days'),
  (3, 2, 76000.00, 'failed', NOW() - INTERVAL '6 days'),
  (3, 2, 42000.00, 'pending', NULL);

COMMIT;

-- Validasi seed (opsional)
-- SELECT status, COUNT(*) FROM payments GROUP BY status ORDER BY status;

-- ==========================================
-- 3) Latihan JOIN (multi-table & counting)
-- ==========================================

-- 3.1 Enrollment + Student + Course
SELECT
  s.id AS student_id,
  s.name AS student_name,
  c.id AS course_id,
  c.title AS course_title,
  e.enrolled_at
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
ORDER BY e.enrolled_at DESC;

-- 3.2 Course overview: total lessons & total paid payments
SELECT
  c.id,
  c.title,
  COUNT(DISTINCT l.id) AS total_lessons,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'paid') AS total_paid_payments
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
LEFT JOIN payments p ON p.course_id = c.id
GROUP BY c.id, c.title
ORDER BY total_paid_payments DESC, c.id ASC;

-- 3.3 LEFT JOIN untuk menampilkan course meski belum punya payments
SELECT
  c.id,
  c.title,
  p.status,
  p.amount
FROM courses c
LEFT JOIN payments p ON p.course_id = c.id
ORDER BY c.id, p.created_at DESC;

-- ==========================
-- 4) Latihan UNION
-- ==========================

-- 4.1 Rekap status per (student_id, course_id)
-- Gabungkan "enrolled" dan "paid" lalu hilangkan duplikat
SELECT student_id, course_id, source
FROM (
  SELECT student_id, course_id, 'enrolled' AS source
  FROM enrollments
  UNION
  SELECT student_id, course_id, 'paid' AS source
  FROM payments
  WHERE status = 'paid'
) x
ORDER BY student_id, course_id, source;

-- 4.2 UNION ALL (jaga duplikat, misal untuk audit log mentah)
SELECT student_id, course_id, source, created_at
FROM (
  SELECT student_id, course_id, 'enrollment' AS source, enrolled_at AS created_at
  FROM enrollments
  UNION ALL
  SELECT student_id, course_id, 'payment' AS source, created_at
  FROM payments
) x
ORDER BY created_at DESC
LIMIT 50;

-- ==========================
-- 5) Latihan Subquery
-- ==========================

-- 5.1 Payments lebih dari rata-rata amount yang status=paid
SELECT p.*
FROM payments p
WHERE p.status = 'paid'
  AND p.amount > (
    SELECT AVG(amount)
    FROM payments
    WHERE status = 'paid'
  )
ORDER BY p.amount DESC;

-- 5.2 Course yang punya jumlah enrollment di atas rata-rata
SELECT x.course_id, x.total_enrollments
FROM (
  SELECT course_id, COUNT(*) AS total_enrollments
  FROM enrollments
  GROUP BY course_id
) x
WHERE x.total_enrollments > (
  SELECT AVG(total_enrollments)
  FROM (
    SELECT COUNT(*) AS total_enrollments
    FROM enrollments
    GROUP BY course_id
  ) y
);

-- 5.3 EXISTS: student yang punya payment paid untuk course tertentu
-- (ganti course_id sesuai kebutuhan)
SELECT s.id, s.name, s.email
FROM students s
WHERE EXISTS (
  SELECT 1
  FROM payments p
  WHERE p.student_id = s.id
    AND p.course_id = 1
    AND p.status = 'paid'
);

-- ==========================
-- 6) Modifying data
-- ==========================

-- 6.1 UPDATE aman: ubah pending yang lama jadi failed (contoh skenario)
-- Buat kondisi fleksibel agar mudah dipahami:
-- - ubah pending yang dibuat lebih dari 1 jam lalu menjadi failed
BEGIN;

-- preview row yang akan diubah
-- SELECT COUNT(*) FROM payments WHERE status='pending' AND created_at < NOW() - INTERVAL '1 hour';

UPDATE payments
SET status = 'failed'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';

COMMIT;

-- 6.2 UPDATE dari hasil JOIN:
-- tandai enrollment aktif jika student punya payment paid untuk (student_id, course_id)
BEGIN;

UPDATE enrollments e
SET is_active = true
FROM payments p
WHERE p.student_id = e.student_id
  AND p.course_id = e.course_id
  AND p.status = 'paid';

COMMIT;

-- 6.3 DELETE massal dengan transaksi:
-- delete payment failed yang terlalu lama (contoh: > 365 hari)
-- (Pada seed ini mungkin tidak terkena, tapi ini pola yang benar)
BEGIN;

-- preview delete target
-- SELECT COUNT(*) FROM payments WHERE status='failed' AND created_at < NOW() - INTERVAL '365 days';

DELETE FROM payments
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '365 days';

COMMIT;

-- ==========================
-- 7) Indexing + EXPLAIN
-- ==========================

-- 7.1 Query kandidat untuk index
-- - JOIN di student_id/course_id
-- - filter status, order by created_at

-- 7.2 Jalankan EXPLAIN ANALYZE sebelum index (opsional)
EXPLAIN ANALYZE
SELECT
  p.student_id,
  COUNT(*) AS total_payments
FROM payments p
WHERE p.course_id = 1
  AND p.status = 'paid'
GROUP BY p.student_id
ORDER BY total_payments DESC;

-- 7.3 Buat index
CREATE INDEX IF NOT EXISTS idx_payments_course_id
  ON payments(course_id);

CREATE INDEX IF NOT EXISTS idx_payments_student_id
  ON payments(student_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created_at
  ON payments(status, created_at);

-- 7.4 Jalankan EXPLAIN ANALYZE sesudah index (opsional)
EXPLAIN ANALYZE
SELECT
  p.student_id,
  COUNT(*) AS total_payments
FROM payments p
WHERE p.course_id = 1
  AND p.status = 'paid'
GROUP BY p.student_id
ORDER BY total_payments DESC;

-- ==========================
-- 8) Bonus mini-challenge
-- ==========================
-- Tugas:
-- 1) Tampilkan course yang memiliki paid payments > 1
-- 2) Gunakan HAVING atau subquery
SELECT
  c.id,
  c.title,
  COUNT(*) FILTER (WHERE p.status = 'paid') AS paid_count
FROM courses c
JOIN payments p ON p.course_id = c.id
GROUP BY c.id, c.title
HAVING COUNT(*) FILTER (WHERE p.status = 'paid') > 1
ORDER BY paid_count DESC, c.id ASC;

