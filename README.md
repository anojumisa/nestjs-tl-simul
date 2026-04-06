<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# nestjs-demo — Learning Platform API (NestJS)

Repository ini adalah **proyek pembelajaran** untuk membangun backend REST API dengan **[NestJS](https://nestjs.com/)** (TypeScript). Materi disusun bertahap di folder `docs/` (Step 01–14) dan **kode di `src/`** mengimplementasikan konsep-konsep tersebut agar bisa didemokan ke mahasiswa: dari module/controller/service, repository pattern, validasi, middleware, interceptor, exception filter, dependency injection, sampai integrasi PostgreSQL dengan raw SQL.

---

## Apa yang ada di repository ini?

| Bagian | Isi |
|--------|-----|
| **`docs/`** | Panduan langkah demi langkah (Bahasa Indonesia): konsep, tugas, checklist. |
| **`src/`** | Aplikasi NestJS: modul `courses`, middleware, interceptor, filter, DTO, repository in-memory + PostgreSQL (raw SQL). |
| **`test/`** | Tes bawaan template Nest (unit / e2e). |
| **`package.json`** | Script (`start`, `build`, `test`) dan dependency (Nest, Swagger, class-validator, dll.). |

**Domain contoh:** *Learning Platform API* — resource **Course** (CRUD) sebagai tulang punggung untuk menjelaskan arsitektur Nest.

---

## Apa yang sudah terimplementasi di kode?

Secara garis besar, codebase ini memuat **satu alur API lengkap** untuk fitur Course, plus **cross-cutting concerns** yang biasa dipakai di API production:

- **Module / Controller / Service** — routing HTTP dan business logic.
- **Repository pattern** — `ICourseRepository` + implementasi `InMemory`, `DemoSeed`, dan `PostgreSQL` (raw SQL) lewat token `COURSE_REPOSITORY`.
- **DTO + ValidationPipe** — validasi body dengan `class-validator`.
- **Swagger** — dokumentasi interaktif di `/docs`.
- **Middleware** — `X-Request-Id`, logging, rate limiting (demo) untuk route `/courses`.
- **Interceptors** — logging durasi + **response wrapper** sukses (`success`, `data`, `meta`).
- **Exception filter** — format error konsisten (`success: false`, `error`, `meta`).
- **Dependency injection** — constructor injection + custom provider token; **demo swap repository** lewat env `COURSE_REPOSITORY_IMPL=demo-seed|postgres` + **`GET /learning/di`** (lihat Step 09 dan `src/courses/learning/`).

Detail teori dan latihan ada di masing-masing file `docs/step-*.md`.

---

## Prasyarat

- **Node.js** (disarankan LTS).
- **pnpm** (repo ini memakai `pnpm-lock.yaml`; bisa juga `npm`/`yarn` jika kamu sesuaikan sendiri).

Cek versi:

```bash
node -v
pnpm -v
```

---

## Cara menjalankan project

Install dependency:

```bash
pnpm install
```

Jalankan server (watch mode, cocok untuk development):

```bash
pnpm run start:dev
```

Default: **`http://localhost:3000`**. Port bisa diubah lewat environment variable **`PORT`**.

### Menjalankan mode PostgreSQL (Step 14)

1. Buat file env:

```bash
cp .env.example .env
```

2. Isi minimal:

- `COURSE_REPOSITORY_IMPL=postgres`
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/learning_platform`
  - atau pakai `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

3. Jalankan migration + seed:

- `docs/sql/migrations/step-14-0001_create_courses_table.sql`
- `docs/sql/seeds/step-14-0002_seed_courses.sql`

4. Start server:

```bash
pnpm run start:dev
```

5. Verifikasi:

```bash
curl -s http://localhost:3000/learning/di | jq .
curl -s http://localhost:3000/courses | jq .
```

Build production:

```bash
pnpm run build
pnpm run start:prod
```

---

## Quick deploy checklist (Railway / Render)

Panduan lengkap ada di `docs/step-10-simple-deployment-railway-render.md`. Untuk checklist super cepat:

- **Pastikan repo sudah di-push ke GitHub**
- **Build command**: `pnpm run build`
- **Start command**: `pnpm run start:prod`
- **Wajib**: platform harus expose `PORT` (kode kita sudah pakai `process.env.PORT`)
- **Verifikasi setelah deploy**:
  - `GET /`
  - `GET /courses`
  - `GET /docs`
  - `GET /learning/di`
- **Opsional (demo DI)**: set env `COURSE_REPOSITORY_IMPL=demo-seed`, redeploy, lalu `GET /courses` lagi

---

## Struktur `src/` (ringkas)

```
src/
  main.ts                 # Bootstrap app: ValidationPipe, Swagger, interceptors, exception filter
  app.module.ts           # Root module
  app.controller.ts       # GET / (pesan sambutan API)
  app.service.ts
  common/
    middleware/           # request id, logger, rate limit (demo)
    interceptors/         # logging, wrap response sukses
    filters/              # format error global
  courses/
    courses.module.ts     # Registrasi middleware untuk /courses + binding DI repository
    courses.controller.ts
    courses.service.ts
    learning/             # Contoh DI untuk demo kelas (anti-pola vs repo alternatif, GET /learning/di)
    dto/                  # CreateCourseDto, UpdateCourseDto (+ validasi)
    entities/             # Course (domain sederhana)
    repositories/         # Interface + InMemoryCourseRepository
```

---

## Learning journey (urutan materi di `docs/`)

Ikuti urutan ini saat belajar atau mengajar:

| Step | Topik | Dokumen |
|------|--------|---------|
| 01 | Setup project & kenalan NestJS | [docs/step-01-project-setup.md](docs/step-01-project-setup.md) |
| 02 | Module, controller, service (Course) | [docs/step-02-first-module-controller-service.md](docs/step-02-first-module-controller-service.md) |
| 03 | Repository pattern (lanjutan) | [docs/step-03-advanced-repository-pattern.md](docs/step-03-advanced-repository-pattern.md) |
| 04 | Dokumentasi API (Postman & Swagger) | [docs/step-04-api-documentation-dengan-postman-dan-swagger.md](docs/step-04-api-documentation-dengan-postman-dan-swagger.md) |
| 05 | DTO & pipes (validasi) | [docs/step-05-dto-dan-pipes.md](docs/step-05-dto-dan-pipes.md) |
| 06 | Middleware | [docs/step-06-middleware.md](docs/step-06-middleware.md) |
| 07 | Interceptors | [docs/step-07-interceptors.md](docs/step-07-interceptors.md) |
| 08 | Exception filters | [docs/step-08-exception-filters.md](docs/step-08-exception-filters.md) |
| 09 | Dependency injection | [docs/step-09-dependency-injection.md](docs/step-09-dependency-injection.md) |
| 10 | Simple deployment (Railway & Render) | [docs/step-10-simple-deployment-railway-render.md](docs/step-10-simple-deployment-railway-render.md) |
| 11 | Database fundamental (DBRMS) | [docs/step-11-database-dbrms-fundamental.md](docs/step-11-database-dbrms-fundamental.md) |
| 12 | SQL fundamental (DDL, CRUD, JOIN, transaction) | [docs/step-12-sql-fundamental.md](docs/step-12-sql-fundamental.md) |
| 13 | Advanced SQL (JOIN lanjutan, UNION, subquery, indexing) | [docs/step-13-advanced-sql-query-and-performance.md](docs/step-13-advanced-sql-query-and-performance.md) |
| 14 | Integrasi PostgreSQL ke NestJS (raw CRUD, migrations, seeding) | [docs/step-14-nestjs-database-integration-crud-raw-migrations-seeding.md](docs/step-14-nestjs-database-integration-crud-raw-migrations-seeding.md) |

---

## Endpoint utama (Course)

Base URL: `http://localhost:3000`

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/` | Pesan sambutan API |
| GET | `/courses` | Daftar course (sumber data mengikuti repository binding aktif) |
| GET | `/courses/:id` | Satu course (`id` angka — `ParseIntPipe`) |
| POST | `/courses` | Buat course (body JSON, divalidasi DTO) |
| PATCH | `/courses/:id` | Update course |
| DELETE | `/courses/:id` | Hapus course |
| GET | `/learning/di` | Info showcase Dependency Injection (binding aktif, path file contoh, langkah demo) |

**Swagger UI:** [http://localhost:3000/docs](http://localhost:3000/docs) — coba endpoint langsung dari browser.

**Demo DI (ganti repository tanpa mengubah `CoursesService`):** set environment variable **`COURSE_REPOSITORY_IMPL=demo-seed`** atau **`COURSE_REPOSITORY_IMPL=postgres`**, restart server, lalu `GET /courses` — sumber data akan mengikuti binding aktif (lihat penjelasan di `GET /learning/di`).

---

## Format response (penting untuk demo)

### Response sukses (dibungkus interceptor)

```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-03-17T12:00:00.000Z",
    "path": "/courses",
    "requestId": "uuid-atau-string"
  }
}
```

Header **`X-Request-Id`** juga diset oleh middleware (untuk korelasi log).

### Response error (dibungkus exception filter)

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": ["..."],
    "details": { }
  },
  "meta": {
    "timestamp": "...",
    "path": "/courses",
    "requestId": "..."
  }
}
```

---

## Contoh cepat dengan `curl`

**GET semua course**

```bash
curl -s http://localhost:3000/courses | jq .
```

**Showcase Dependency Injection (mentor)**

```bash
curl -s http://localhost:3000/learning/di | jq .
```

**Jalankan dengan repository demo alternatif** (setelah stop instance server yang sedang jalan):

```bash
COURSE_REPOSITORY_IMPL=demo-seed pnpm run start:dev
```

**POST course baru**

```bash
curl -s -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Fundamental NestJS untuk Pemula","description":"Kelas pengantar untuk memahami dasar NestJS dan REST API."}' | jq .
```

**Panduan lengkap CRUD verifikasi Step 14**

- Lihat `docs/step-14-curl-examples.md`

**Lihat header (termasuk `X-Request-Id` dan rate limit jika sudah lewat request ke-2 dalam window)**

```bash
curl -i http://localhost:3000/courses
```

---

## Tes otomatis

```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

> Catatan: di beberapa environment, `jest` bisa bergantung pada watchman. Jika ada error terkait watchman, jalankan tes dengan opsi yang menonaktifkan watch atau perbaiki konfigurasi environment lokal.

---

## Referensi NestJS (di luar materi mentoring)

- [Dokumentasi resmi NestJS](https://docs.nestjs.com)
- [Repositori NestJS di GitHub](https://github.com/nestjs/nest)

---

## Lisensi

NestJS dilisensikan MIT — lihat [LICENSE NestJS](https://github.com/nestjs/nest/blob/master/LICENSE). Isi repo pembelajaran ini mengikuti keperluan proyek lokal Anda; sesuaikan lisensi jika didistribusikan terpisah.
