# Step 13 - Advanced SQL (Joins, Union, Subquery, Data Update, Indexing)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Mampu menulis** query gabungan multi-table dengan berbagai jenis `JOIN`.
- **Memahami** kapan menggunakan `UNION` dan `UNION ALL`.
- **Mampu menggunakan** `SUBQUERY` untuk kebutuhan filtering dan analisis.
- **Mampu melakukan** update data massal secara aman dan terkontrol.
- **Memahami dasar indexing** dan optimasi query agar performa meningkat.

---

## 2. Kenapa topik ini penting?

Di dunia nyata, **satu table hampir tidak pernah cukup**.
Kita sering butuh:

- gabungkan data user, order, payment, dan shipment,
- lihat insight lintas table,
- update data dalam jumlah besar dengan aman,
- dan pastikan query tetap cepat saat data membesar.

Kalau SQL fundamental itu "belajar jalan", maka advanced SQL ini "belajar nyetir di jalan ramai".

---

## 3. Dataset contoh yang dipakai

Kita pakai table dari step sebelumnya:

- `courses`
- `lessons`
- `students`
- `enrollments`

Tambahan table untuk praktik:

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 4. JOIN lanjutan - karena satu table tidak cukup

### 4.1. Recap cepat jenis JOIN

- `INNER JOIN`: hanya data yang match di kedua table.
- `LEFT JOIN`: semua data kiri + yang match dari kanan.
- `RIGHT JOIN`: kebalikan dari left join.
- `FULL OUTER JOIN`: gabungan semua data kiri dan kanan.

### 4.2. INNER JOIN - student yang benar-benar punya enrollment

```sql
SELECT
  s.id,
  s.name,
  c.title AS course_title,
  e.enrolled_at
FROM enrollments e
INNER JOIN students s ON s.id = e.student_id
INNER JOIN courses c ON c.id = e.course_id
ORDER BY e.enrolled_at DESC;
```

### 4.3. LEFT JOIN - course yang belum punya student tetap tampil

```sql
SELECT
  c.id,
  c.title,
  COUNT(e.id) AS total_students
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title
ORDER BY total_students DESC, c.id ASC;
```

### 4.4. SELF JOIN - bandingkan student dalam domain email yang sama

```sql
SELECT
  s1.name AS student_a,
  s2.name AS student_b,
  SPLIT_PART(s1.email, '@', 2) AS email_domain
FROM students s1
JOIN students s2
  ON SPLIT_PART(s1.email, '@', 2) = SPLIT_PART(s2.email, '@', 2)
 AND s1.id < s2.id;
```

---

## 5. UNION dan UNION ALL

`UNION` dipakai saat kamu ingin **menggabungkan hasil dari 2 query** yang struktur kolomnya sama.

Perbedaan:

- `UNION`: menghapus data duplikat.
- `UNION ALL`: mempertahankan duplikat (biasanya lebih cepat).

### 5.1. Contoh UNION

```sql
SELECT student_id, course_id, 'enrolled' AS source
FROM enrollments

UNION

SELECT student_id, course_id, 'paid' AS source
FROM payments
WHERE status = 'paid';
```

### 5.2. Contoh UNION ALL (untuk audit log/rekap mentah)

```sql
SELECT student_id, course_id, created_at, 'enrollment' AS source
FROM enrollments

UNION ALL

SELECT student_id, course_id, created_at, 'payment' AS source
FROM payments;
```

---

## 6. Subquery - query di dalam query

Subquery cocok untuk:

- mencari nilai acuan dulu (misalnya rata-rata),
- lalu dipakai untuk filter/query utama.

### 6.1. Student dengan payment di atas rata-rata

```sql
SELECT
  p.student_id,
  p.course_id,
  p.amount
FROM payments p
WHERE p.amount > (
  SELECT AVG(amount)
  FROM payments
  WHERE status = 'paid'
);
```

### 6.2. Course yang punya enrollment lebih dari rata-rata

```sql
SELECT x.course_id, x.total_students
FROM (
  SELECT course_id, COUNT(*) AS total_students
  FROM enrollments
  GROUP BY course_id
) x
WHERE x.total_students > (
  SELECT AVG(course_count)
  FROM (
    SELECT COUNT(*) AS course_count
    FROM enrollments
    GROUP BY course_id
  ) y
);
```

### 6.3. EXISTS - cek keberadaan relasi

```sql
SELECT s.id, s.name, s.email
FROM students s
WHERE EXISTS (
  SELECT 1
  FROM payments p
  WHERE p.student_id = s.id
    AND p.status = 'paid'
);
```

---

## 7. Modifying data - seperti beresin kamar berantakan

Update dan delete di production harus rapih, bertahap, dan aman.
Prinsipnya: **jangan langsung sapu semua barang tanpa lihat labelnya**.

### 7.1. UPDATE aman dengan filter yang jelas

```sql
UPDATE payments
SET status = 'failed'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '3 days';
```

### 7.2. UPDATE dari hasil JOIN

Contoh: tandai enrollment sebagai aktif jika payment sudah paid.

```sql
ALTER TABLE enrollments
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

UPDATE enrollments e
SET is_active = true
FROM payments p
WHERE p.student_id = e.student_id
  AND p.course_id = e.course_id
  AND p.status = 'paid';
```

### 7.3. DELETE aman dengan transaksi

```sql
BEGIN;

DELETE FROM payments
WHERE status = 'failed'
  AND created_at < NOW() - INTERVAL '30 days';

-- Validasi dulu hasil sementara
-- SELECT COUNT(*) FROM payments WHERE status = 'failed';

COMMIT;
```

Jika hasil tidak sesuai ekspektasi:

```sql
ROLLBACK;
```

### 7.4. Checklist sebelum mass update/delete

- Pakai `SELECT` dulu dengan kondisi yang sama.
- Pastikan ada `WHERE` yang spesifik.
- Jalankan dalam transaction saat operasi berisiko.
- Simpan backup/snapshot jika data sangat kritikal.
- Hindari eksekusi jam traffic tinggi.

---

## 8. Indexing dan optimasi performa

Kalau table makin besar, query tanpa index akan terasa seperti "lari pakai sandal jepit di jalan berbatu".

### 8.1. Kapan perlu index?

Kolom yang sering:

- dipakai di `WHERE`,
- dipakai di `JOIN`,
- dipakai di `ORDER BY`.

### 8.2. Contoh membuat index

```sql
CREATE INDEX idx_enrollments_student_id
  ON enrollments(student_id);

CREATE INDEX idx_enrollments_course_id
  ON enrollments(course_id);

CREATE INDEX idx_payments_status_created_at
  ON payments(status, created_at);
```

### 8.3. Validasi performa pakai EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT
  e.student_id,
  COUNT(*) AS total_enrollment
FROM enrollments e
WHERE e.course_id = 1
GROUP BY e.student_id;
```

Tips membaca output:

- Perhatikan apakah planner memilih `Seq Scan` atau `Index Scan`.
- Cek nilai `actual time` dan `rows`.
- Jika query berat, cek kembali index dan struktur query.

### 8.4. Praktik optimasi dasar

- Hindari `SELECT *` untuk endpoint production.
- Ambil kolom seperlunya.
- Batasi data dengan `LIMIT`.
- Pakai pagination.
- Pastikan index mendukung pola query utama.

---

## 9. Kesalahan umum di level advanced

- Menambah terlalu banyak index sampai write jadi lambat.
- Menggunakan `UNION` padahal butuh `UNION ALL`.
- Menulis subquery rumit tanpa cek execution plan.
- Menjalankan mass update tanpa transaction.
- Mengabaikan statistik/query plan setelah data tumbuh.

---

## 10. Latihan mandiri (wajib)

Gunakan file praktik:

- `docs/sql/step-13-advanced-sql-exercises.sql`

1. Buat minimal 10 data di `payments`.
2. Tulis 3 query JOIN:
   - enrollment + student + course,
   - student + payment,
   - course + total paid student.
3. Tulis 2 query gabungan:
   - 1 dengan `UNION`,
   - 1 dengan `UNION ALL`.
4. Tulis 2 subquery:
   - 1 dengan `IN`/`EXISTS`,
   - 1 dengan aggregate.
5. Buat index untuk 2 query paling sering dipakai.
6. Bandingkan query sebelum vs sesudah index dengan `EXPLAIN ANALYZE`.

---

## 11. Checklist penilaian

Kamu dianggap **lulus Step 13** jika:

- [ ] Bisa menjelaskan perbedaan `INNER/LEFT/FULL JOIN`.
- [ ] Bisa memilih antara `UNION` vs `UNION ALL`.
- [ ] Bisa membuat subquery yang benar untuk filtering/analitik.
- [ ] Bisa melakukan update/delete massal secara aman.
- [ ] Bisa membuat index dasar dan membaca hasil `EXPLAIN ANALYZE`.

---

## 12. Next Step (preview)

Setelah advanced SQL:

- Integrasi query SQL ke repository pattern di NestJS,
- Perbandingan raw SQL vs ORM query builder,
- Lanjut praktik di `docs/step-14-nestjs-database-integration-crud-raw-migrations-seeding.md`,
- Strategi migration dan seed data untuk environment team.
