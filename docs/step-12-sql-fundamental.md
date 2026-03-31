# Step 12 – SQL Fundamental (DDL, CRUD, JOIN, Transaction)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Mampu menulis** SQL dasar untuk create/insert/select/update/delete.
- **Memahami** perbedaan DDL, DML, dan query retrieval.
- **Mampu menggunakan** filter, sorting, pagination, dan aggregate query.
- **Mampu menulis** JOIN dasar untuk kebutuhan API backend.
- **Memahami praktik transaction** (commit/rollback) pada kasus nyata.

---

## 2. Recap singkat dari Step 11

Di Step 11 kita fokus desain data model dan konsep DBRMS.
Sekarang di Step 12 kita fokus **eksekusi query SQL** ke schema tersebut.

Contoh table yang dipakai:

- `courses`
- `lessons`
- `students`
- `enrollments`

---

## 3. Workflow praktikum dengan DB management tools

Gunakan DBeaver/pgAdmin dengan alur kerja ini saat latihan SQL:

1. Buat koneksi ke database target.
2. Buka SQL editor / query tool.
3. Jalankan script DDL dulu (`CREATE TABLE`).
4. Lanjutkan DML (`INSERT` sample data).
5. Jalankan query `SELECT`, `JOIN`, `GROUP BY`.
6. Simpan script latihan per topik agar bisa dipakai ulang.

Tips kelas:

- Simpan script di file terpisah (`01_schema.sql`, `02_seed.sql`, `03_queries.sql`).
- Selalu cek database/connection aktif sebelum eksekusi query.
- Untuk langkah klik-menu DBeaver/pgAdmin, lihat `docs/appendix-db-tools-quickstart.md`.

---

## 4. Klasifikasi command SQL yang perlu dipahami

- **DDL** (Data Definition Language): `CREATE`, `ALTER`, `DROP`
- **DML** (Data Manipulation Language): `INSERT`, `UPDATE`, `DELETE`
- **DQL** (Data Query Language): `SELECT`
- **TCL** (Transaction Control Language): `BEGIN`, `COMMIT`, `ROLLBACK`

---

## 5. DDL – membuat struktur table

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

```sql
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  position INT NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_lessons_course
    FOREIGN KEY (course_id)
    REFERENCES courses(id)
    ON DELETE CASCADE
);
```

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

```sql
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_enrollments_student
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);
```

---

## 6. DML – INSERT data

```sql
INSERT INTO courses (title, description)
VALUES
  ('Fundamental NestJS untuk Pemula', 'Pengantar backend dengan NestJS'),
  ('TypeScript Lanjutan untuk Backend', 'Tipe lanjutan dan best practice');
```

```sql
INSERT INTO lessons (course_id, title, position, duration_minutes)
VALUES
  (1, 'Intro NestJS', 1, 20),
  (1, 'Controller & Service', 2, 35),
  (2, 'Utility Types', 1, 30);
```

```sql
INSERT INTO students (name, email)
VALUES
  ('Ayu', 'ayu@example.com'),
  ('Bima', 'bima@example.com');
```

```sql
INSERT INTO enrollments (student_id, course_id)
VALUES
  (1, 1),
  (2, 1),
  (2, 2);
```

---

## 7. SELECT dasar (read data)

### 6.1. Ambil semua data

```sql
SELECT id, title, description
FROM courses
ORDER BY id DESC;
```

### 6.2. Filter data

```sql
SELECT id, title
FROM courses
WHERE title ILIKE '%nestjs%';
```

### 6.3. Pagination sederhana

```sql
SELECT id, title
FROM courses
ORDER BY id DESC
LIMIT 10 OFFSET 0;
```

---

## 8. UPDATE dan DELETE

### 7.1. UPDATE

```sql
UPDATE courses
SET title = 'Fundamental NestJS (Updated)',
    updated_at = NOW()
WHERE id = 1;
```

### 7.2. DELETE

```sql
DELETE FROM courses
WHERE id = 2;
```

Jika table terkait menggunakan `ON DELETE CASCADE`, data child akan ikut terhapus.

---

## 9. JOIN (sangat penting untuk backend API)

### 8.1. JOIN course dengan lesson

```sql
SELECT
  c.id AS course_id,
  c.title AS course_title,
  l.id AS lesson_id,
  l.title AS lesson_title,
  l.position
FROM courses c
JOIN lessons l ON l.course_id = c.id
ORDER BY c.id, l.position;
```

### 8.2. JOIN enrollment (student ikut course apa)

```sql
SELECT
  s.name AS student_name,
  s.email,
  c.title AS course_title,
  e.enrolled_at
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
ORDER BY e.enrolled_at DESC;
```

---

## 10. Aggregate query (count, grouping)

### 9.1. Jumlah lesson per course

```sql
SELECT
  c.id,
  c.title,
  COUNT(l.id) AS total_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
GROUP BY c.id, c.title
ORDER BY total_lessons DESC;
```

### 9.2. Jumlah student per course

```sql
SELECT
  c.id,
  c.title,
  COUNT(e.id) AS total_students
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title
ORDER BY total_students DESC;
```

---

## 11. Transaction dasar (BEGIN/COMMIT/ROLLBACK)

Contoh: buat course + 2 lesson awal dalam satu transaksi.

```sql
BEGIN;

INSERT INTO courses (title, description)
VALUES ('Backend API Design', 'Belajar desain API untuk production');

-- asumsi id course terbaru = 3 (pada praktik nyata gunakan RETURNING id)
INSERT INTO lessons (course_id, title, position, duration_minutes)
VALUES (3, 'REST Principles', 1, 40);

INSERT INTO lessons (course_id, title, position, duration_minutes)
VALUES (3, 'Error Handling Strategy', 2, 35);

COMMIT;
```

Jika ada query gagal, gunakan:

```sql
ROLLBACK;
```

> Catatan praktik: di PostgreSQL, sebaiknya pakai `INSERT ... RETURNING id` untuk mendapatkan id record baru secara aman.

---

## 12. Kesalahan umum pemula

- Lupa `WHERE` saat `UPDATE`/`DELETE` -> semua row berubah/terhapus.
- Tidak pakai transaksi untuk operasi multi-langkah.
- Tidak menambah index pada kolom yang sering difilter/join.
- Menulis query dulu tanpa memahami relasi schema.
- Mengandalkan validasi backend saja tanpa constraint DB.

---

## 13. Latihan mandiri (wajib)

1. Buat script SQL:
   - create table `courses`, `lessons`, `students`, `enrollments`
   - insert minimal 3 course, 5 lesson, 3 student, 4 enrollment
2. Tulis query:
   - tampilkan lesson per course (JOIN)
   - tampilkan jumlah student per course (GROUP BY)
   - tampilkan course dengan title mengandung kata “Nest”
3. Simulasikan transaksi:
   - insert course + lesson
   - sengaja buat 1 insert gagal
   - lakukan rollback
4. Dokumentasikan hasil di file catatan `notes-step-12-sql.md`.

---

## 14. Checklist penilaian

Kamu dianggap **lulus Step 12** jika:

- [ ] Bisa membedakan DDL, DML, DQL, TCL.
- [ ] Bisa menulis query CRUD dasar.
- [ ] Bisa menulis JOIN dan aggregate query sederhana.
- [ ] Paham kapan perlu transaction.
- [ ] Paham risiko query tanpa `WHERE`.

---

## 15. Next Step (preview)

Setelah SQL fundamental:

- Integrasi **Prisma + PostgreSQL**,
- Mapping schema ke model ORM,
- Implementasi repository nyata (`PrismaCourseRepository`) di NestJS.

