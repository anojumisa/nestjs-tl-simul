# Step 11 – DBRMS Fundamental (Concept & Data Modeling)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** apa itu DBRMS dan kenapa backend production hampir selalu butuh database.
- **Mengenal** konsep inti relational database: table, row, column, PK, FK, constraint, index.
- **Memahami** desain relasi 1-1, 1-N, N-N pada kasus Learning Platform.
- **Mampu merancang** schema awal sebelum menulis query SQL.
- **Siap** masuk ke Step 12 (SQL fundamental) untuk praktik query.

---

## 2. Kenapa kita pindah dari in-memory ke DBRMS?

Sampai Step 10, data kita masih in-memory (array), bagus untuk belajar arsitektur NestJS. Tapi untuk project nyata, ada keterbatasan:

- Data hilang saat server restart.
- Sulit dipakai pada deployment multi-instance.
- Sulit menjaga integritas data di skala besar.
- Sulit audit, backup, dan restore.

DBRMS (PostgreSQL/MySQL, dll.) memberi:

- Data persistence (durable),
- Struktur data jelas dan terstandardisasi,
- Integritas melalui constraint,
- Fondasi transaksi (ACID) untuk operasi kritikal.

---

## 3. Konsep inti DBRMS (wajib paham dulu)

### 3.1. Table, row, column

- **Table**: kumpulan entitas sejenis (`courses`, `lessons`, `students`).
- **Row**: satu record/entitas.
- **Column**: atribut data (`title`, `created_at`, dll.).

### 3.2. Primary key (PK)

- Identitas unik tiap row.
- Umum: `id` (integer auto increment) atau UUID.

### 3.3. Foreign key (FK)

- Column yang menunjuk PK di table lain.
- Menjaga relasi antar table tetap valid.

Contoh: `lessons.course_id -> courses.id`.

### 3.4. Constraint

Constraint adalah “penjaga kualitas data” di level DB:

- `NOT NULL`
- `UNIQUE`
- `CHECK`
- `FOREIGN KEY`

### 3.5. Index

Index mempercepat baca data (query/filter/sort), tapi menambah biaya write.
Karena itu index dipasang berdasarkan kebutuhan query, bukan semua kolom.

---

## 4. Relasi database yang perlu dipahami

### 4.1. One-to-one (1-1)

Contoh: `users` dan `user_profiles` (1 user punya 1 profile).

### 4.2. One-to-many (1-N)

Contoh: 1 `course` punya banyak `lessons`.

### 4.3. Many-to-many (N-N)

Contoh: `students` bisa ikut banyak `courses`, dan `courses` punya banyak `students`.
Biasanya butuh table penghubung: `enrollments`.

---

## 5. Data modeling untuk domain Learning Platform

Contoh model awal:

```text
courses
-------
id (PK)
title
description
created_at
updated_at

lessons
-------
id (PK)
course_id (FK -> courses.id)
title
position
duration_minutes
created_at
updated_at

students
--------
id (PK)
name
email (UNIQUE)
created_at
updated_at

enrollments
-----------
id (PK)
student_id (FK -> students.id)
course_id (FK -> courses.id)
enrolled_at
UNIQUE(student_id, course_id)
```

Poin penting:

- `enrollments` mencegah duplikasi enrollment lewat unique gabungan.
- FK memastikan tidak ada enrollment ke student/course yang tidak ada.

---

## 6. Normalisasi (versi praktis untuk pemula)

Tujuan normalisasi: mengurangi data duplikat dan inkonsistensi.

Contoh anti-pattern:

- Menyimpan `course_title` berulang di table `lessons`.

Masalah:

- Jika title course berubah, semua row lesson harus diupdate -> rawan mismatch.

Solusi:

- Simpan title di `courses`, dan hubungan lewat `course_id`.

Untuk tahap awal, biasakan:

- Pisahkan entitas utama ke table berbeda.
- Hubungkan dengan FK.
- Hindari menyimpan data turunan berulang tanpa alasan.

---

## 7. ACID & transaksi (konsep dulu)

Empat properti penting transaksi:

- **Atomicity**: sukses semua atau gagal semua.
- **Consistency**: data tetap valid sesuai constraint.
- **Isolation**: transaksi paralel tidak saling merusak.
- **Durability**: data tersimpan permanen setelah commit.

Contoh kasus LMS:

- Buat course + lesson awal harus jadi satu unit operasi.
- Jika satu langkah gagal, rollback agar data tidak setengah jadi.

> Implementasi query transaksi kita bahas detail di Step 12.

---

## 8. Mapping ke arsitektur NestJS di project ini

Relasi ke codebase kamu:

- **Controller**: tetap urus HTTP.
- **Service**: tetap urus business logic.
- **Repository**: dari in-memory menuju implementasi DB.
- **DI token `COURSE_REPOSITORY`**: tetap jadi kontrak stabil.

Artinya arsitektur yang sudah dibangun (Step 03 + Step 09) memang mempersiapkan migrasi database secara bersih.

---

## 9. Database management tools (DBeaver, pgAdmin, dll.)

Saat belajar DBRMS, kamu tidak hanya butuh SQL syntax, tapi juga tool untuk:

- membuat koneksi ke database,
- melihat schema/table/constraint,
- menjalankan query,
- membaca data dan export hasil.

### 9.1. DBeaver (multi-database, cocok untuk pemula)

**Kelebihan:**

- Support banyak DB (PostgreSQL, MySQL, MariaDB, SQLite, dll.).
- UI cukup intuitif untuk browse table dan menjalankan SQL script.
- Cocok untuk kelas karena satu tool bisa dipakai lintas DB.

**Kapan dipakai:**

- Ingin satu tool universal untuk semua praktikum database.
- Ingin lihat relasi table secara visual dan cepat.

### 9.2. pgAdmin (khusus PostgreSQL)

**Kelebihan:**

- Resmi untuk PostgreSQL ecosystem.
- Fitur admin PostgreSQL cukup lengkap.
- Cocok kalau stack kelas kamu fokus ke PostgreSQL.

**Kapan dipakai:**

- Praktikum khusus PostgreSQL.
- Butuh eksplorasi fitur PostgreSQL yang lebih spesifik.

### 9.3. Tool lain yang juga umum

- **TablePlus** (UI cepat, berbayar/freemium)
- **DataGrip** (powerful, berbayar, cocok untuk kerja profesional)
- **Beekeeper Studio** (alternatif ringan)

Untuk pembelajaran awal, rekomendasi praktis:

- **Default kelas**: DBeaver
- **Jika fokus PostgreSQL murni**: pgAdmin

### 9.4. Minimal skill tool yang harus dikuasai student

student tidak perlu hafal semua menu tool. Cukup kuasai:

1. Membuat koneksi DB (host, port, db name, user, password).
2. Membuka SQL editor.
3. Menjalankan SQL script (`CREATE`, `INSERT`, `SELECT`, dll.).
4. Melihat hasil query dan isi table.
5. Export hasil query sederhana (CSV/JSON, opsional).

### 9.5. Koneksi database: parameter yang harus dipahami

Saat connect dari DBeaver/pgAdmin, biasanya butuh:

- `host` (contoh: `localhost`)
- `port` (PostgreSQL default: `5432`)
- `database name`
- `username`
- `password`
- (opsional) `ssl mode`

> Jangan commit kredensial database ke git. Simpan di environment variable atau secret manager.

Untuk panduan praktis klik-menu per tool, lihat:

- `docs/appendix-db-tools-quickstart.md`

---

## 10. Use case nyata di industri

### 10.1. Integritas data

E-commerce, fintech, LMS production sangat mengandalkan FK + constraint + transaksi.

### 10.2. Skalabilitas tim

Schema yang rapi memudahkan kolaborasi backend, data analyst, dan QA.

### 10.3. Audit & compliance

Data di DB lebih mudah dibackup, dilacak, dan direstore dibanding penyimpanan in-memory.

---

## 11. Tugas mandiri (wajib)

1. Gambar ERD sederhana untuk:
   - `students`
   - `courses`
   - `lessons`
   - `enrollments`
2. Tandai PK, FK, dan constraint `UNIQUE` yang dibutuhkan.
3. Jelaskan:
   - kenapa `enrollments` perlu unique gabungan,
   - kenapa relasi N-N perlu table penghubung.
4. Refleksi 1 paragraf:
   - “Bagian mana dari desain schema yang paling sulit dan kenapa?”

---

## 12. Checklist penilaian

Kamu dianggap **lulus Step 11** jika:

- [ ] Paham bedanya in-memory storage vs DBRMS.
- [ ] Paham PK, FK, constraint, index, dan relasi 1-1 / 1-N / N-N.
- [ ] Bisa menjelaskan desain schema sederhana untuk LMS.
- [ ] Paham konsep normalisasi dasar.
- [ ] Paham konsep ACID dan alasan transaksi diperlukan.

---

## 13. Next Step (preview)

Setelah fondasi DBRMS ini, lanjut ke:

- **Step 12 – SQL Fundamental** (DDL, CRUD, JOIN, aggregate, transaction query).

