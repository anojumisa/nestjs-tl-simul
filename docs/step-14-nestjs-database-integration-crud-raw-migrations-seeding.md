# Step 14 - Integrasi Database ke NestJS (CRUD Raw + Migrations & Seeding)

## 1. Tujuan Belajar

Setelah step ini kamu mampu:

- Menghubungkan aplikasi NestJS dengan PostgreSQL.
- Menyusun CRUD menggunakan **raw SQL** (bukan ORM).
- Memakai pola **repository** yang sudah ada di project.
- Menyiapkan **migrations** dan **seed data** agar environment konsisten.

---

## 2. Gambaran Arsitektur (mengikuti repo kamu)

Di project ini, `CoursesService` menggunakan `ICourseRepository` via injection token:

- `src/courses/courses.service.ts` menggunakan `@Inject('COURSE_REPOSITORY')`.
- `src/courses/courses.module.ts` melakukan binding implementation berdasarkan env:
  - default: `InMemoryCourseRepository`
  - demo: `DemoSeedCourseRepository` (`COURSE_REPOSITORY_IMPL=demo-seed`)

Untuk integrasi database, kita menambahkan implementasi baru:

- `PostgresCourseRepository` (implementasi `ICourseRepository`)
- yang menjalankan query via `pg` (node-postgres) / raw SQL

Diagram alur request sampai ke database:

```mermaid
flowchart LR
  A[HTTP Request<br/>GET/POST/PATCH/DELETE /courses]
  B[CoursesController]
  C[CoursesService<br/>@Inject COURSE_REPOSITORY]
  D[CoursesModule Provider Factory<br/>cek COURSE_REPOSITORY_IMPL]
  E[PostgresCourseRepository]
  F[pg Pool]
  G[(PostgreSQL)]
  H[DemoSeedCourseRepository]
  I[InMemoryCourseRepository]

  A --> B --> C --> D
  D -->|postgres| E --> F --> G
  D -->|demo-seed| H
  D -->|default| I
```

---

## 3. Setup PostgreSQL

Pastikan PostgreSQL sudah berjalan dan kamu punya salah satu konfigurasi:

- `DATABASE_URL` (opsi paling mudah), contoh:
  - `postgresql://USER:PASSWORD@localhost:5432/learning_platform`
- atau parameter terpisah (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`)

### 3.1 Membuat database (pilih salah satu cara)

#### A) Manual lewat DBeaver

1. Buat koneksi PostgreSQL dulu (lihat `docs/appendix-db-tools-quickstart.md`).
2. Di panel Database Navigator: klik kanan server/connection PostgreSQL kamu.
3. Pilih **Create** -> **Database**.
4. Isi nama database, contoh: `learning_platform`.
5. Klik **OK**.
6. Refresh navigator, lalu pastikan database `learning_platform` muncul.

#### B) Lewat terminal (CLI)

Opsi 1 - `createdb` (paling simpel kalau tersedia):

```bash
createdb learning_platform
```

Jika butuh user/host/port:

```bash
createdb -h localhost -p 5432 -U postgres learning_platform
```

Opsi 2 - `psql`:

```bash
psql -h localhost -p 5432 -U postgres -d postgres \
  -c "CREATE DATABASE learning_platform;"
```

Catatan:

- Jika kamu pakai `DATABASE_URL`, pastikan DB name di URL sama dengan DB yang kamu buat.
- Setelah database ada, baru jalankan migration & seed di bagian berikutnya.

---

## 3.2 Setup environment variables dengan `.env` (wajib untuk database)

Di repo ini, kita pakai `process.env` untuk:

- memilih repository implementation (`COURSE_REPOSITORY_IMPL`)
- membaca konfigurasi koneksi database (`DATABASE_URL` atau `PG*`)
- set port (`PORT`)

Supaya local development rapi, kita gunakan **file `.env`**.

### 3.2.1 File yang disediakan

- `.env` **tidak** disimpan ke git (sudah di-ignore di `.gitignore`)
- `.env.example` disediakan sebagai template

Langkah:

```bash
cp .env.example .env
```

### 3.2.2 Minimal env untuk pakai PostgreSQL

Pilih satu cara koneksi:

**A) `DATABASE_URL`**

- set:
  - `COURSE_REPOSITORY_IMPL=postgres`
  - `DATABASE_URL=postgresql://.../learning_platform`

**B) Split env (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`)**

- set:
  - `COURSE_REPOSITORY_IMPL=postgres`
  - `PGHOST=...`, `PGUSER=...`, `PGPASSWORD=...`, `PGDATABASE=...` (dan opsional `PGPORT`)

### 3.2.3 Cara `.env` dibaca oleh NestJS

Project ini memakai `@nestjs/config` (lihat `ConfigModule.forRoot({ isGlobal: true })` di `src/app.module.ts`)
untuk memuat `.env` ke `process.env` saat aplikasi start.

Catatan:

- Di production (Railway/Render), kamu biasanya set env vars lewat dashboard — tidak pakai `.env` file.
- Jangan commit `.env` karena berisi credential.

---

## 3.3 Pool setup (koneksi database yang dipakai aplikasi)

Di integrasi ini kita memakai `Pool` dari package `pg`, bukan single connection.

Kenapa pakai pool?

- Reuse koneksi antar request (lebih efisien).
- Hindari overhead buka/tutup koneksi setiap query.
- Lebih aman untuk request concurrent.
- Bisa graceful shutdown saat app berhenti.

### 3.3.1 Cara pool dibentuk di project ini

Di `src/courses/courses.module.ts`, saat `COURSE_REPOSITORY_IMPL=postgres`:

1. App cek `DATABASE_URL`.
2. Jika ada, pool dibuat dari `connectionString`.
3. Jika tidak ada, pool dibuat dari env terpisah: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.
4. Pool diinject ke `PostgresCourseRepository`.

Contoh pola:

```ts
const databaseUrl = process.env.DATABASE_URL;

const pool =
  databaseUrl && databaseUrl.length > 0
    ? new Pool({ connectionString: databaseUrl })
    : new Pool({
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      });
```

### 3.3.2 Validasi konfigurasi minimum

Jika `DATABASE_URL` kosong, minimal pastikan:

- `PGHOST`
- `PGUSER`
- `PGDATABASE`
- `PGPASSWORD` sesuai user database

Tanpa konfigurasi ini, aplikasi akan gagal start di mode `postgres`.

### 3.3.3 Lifecycle koneksi

Di `PostgresCourseRepository`, pool ditutup saat module shutdown dengan `onModuleDestroy()`:

```ts
async onModuleDestroy() {
  await this.pool.end();
}
```

Ini mencegah koneksi menggantung saat app stop/restart.

---

## 4. Install dependency (raw SQL)

Kalau kamu pilih pendekatan raw queries via `pg`, install:

- `pg` (PostgreSQL driver)
- `@nestjs/config` untuk memuat `.env` lewat `ConfigModule.forRoot(...)`

Catatan: Step ini fokus konsep + wiring. Kalau kamu sudah punya mekanisme env sendiri, cukup sesuaikan.

---

## 5. Implementasi repository dengan raw SQL (konsep)

Buat class implementasi:

- `src/courses/repositories/postgres-course.repository.ts`

Kontraknya tetap mengikuti `ICourseRepository`:

- `findAll`, `findOne`, `create`, `update`, `remove`

Contoh pola query (PostgreSQL):

### 5.1 Read

`findAll`:

```sql
SELECT id, title, description
FROM courses
ORDER BY id ASC;
```

`findOne`:

```sql
SELECT id, title, description
FROM courses
WHERE id = $1;
```

### 5.2 Create

```sql
INSERT INTO courses (title, description)
VALUES ($1, $2)
RETURNING id, title, description;
```

### 5.3 Update (aman untuk “cek row ada/tidak”)

```sql
UPDATE courses
SET
  title = $1,
  description = $2,
  updated_at = NOW()
WHERE id = $3
RETURNING id, title, description;
```

Kalau query `RETURNING` menghasilkan `0 row`, berarti `id` tidak ditemukan.

### 5.4 Delete

```sql
DELETE FROM courses
WHERE id = $1
RETURNING id;
```

Jika tidak ada row yang kembali, berarti `id` tidak ada.

---

## 6. Migrations & Seeding (script SQL siap pakai)

Untuk memudahkan, di repo ini kamu dapat menjalankan script berikut secara manual melalui DBeaver/pgAdmin atau `psql`.

### 6.1 Migrations

Jalankan:

- `docs/sql/migrations/step-14-0001_create_courses_table.sql`

### 6.2 Seed data

Lalu jalankan:

- `docs/sql/seeds/step-14-0002_seed_courses.sql`

---

## 7. Mengaktifkan PostgreSQL repository lewat env

Di `CoursesModule`, buat binding baru misalnya:

- `COURSE_REPOSITORY_IMPL=postgres`

Lalu isi konfigurasi koneksi PostgreSQL:

- Paling mudah: `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME`
- Alternatif: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

Setelah ini:

- `GET /courses` harus menampilkan data dari table `courses`
- `POST /courses`, `PATCH /courses/:id`, `DELETE /courses/:id` harus melakukan perubahan ke database

---

## 8. Latihan mandiri (wajib)

1. Jalankan migration `step-14-0001_create_courses_table.sql`.
2. Jalankan seed `step-14-0002_seed_courses.sql`.
3. Pastikan endpoint:
   - `GET /courses`
   - `GET /courses/:id`
   - `POST /courses`
   - `PATCH /courses/:id`
   - `DELETE /courses/:id`
     bekerja dan perubahan terlihat langsung di database.

---

## 9. Checklist penilaian

- [ ] Bisa menjelaskan peran repository + injection token di project.
- [ ] Bisa menjalankan migration & seed sampai tabel terisi.
- [ ] CRUD endpoint benar-benar mempengaruhi data di PostgreSQL.
- [ ] Query update/delete tidak “berbahaya” (pakai parameter $1/$2/$3 dan filter `WHERE`).

---

## 10. Next Step (preview)

- Integrasi relasi tabel (misal `lessons`, `enrollments`) agar JOIN benar-benar tercermin di endpoint.
- Implementasi query lanjutan (pagination, sorting, filtering) lewat raw SQL.
