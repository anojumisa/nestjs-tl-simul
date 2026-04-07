# Step 15 - Prisma Commands & Verification

Dokumen ini fokus command siap pakai agar student bisa cepat praktik.

## 0. Prasyarat

- PostgreSQL sudah running.
- `.env` sudah ada dan `DATABASE_URL` valid.
- `COURSE_REPOSITORY_IMPL=prisma`.

Contoh:

```env
COURSE_REPOSITORY_IMPL=prisma
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/learning_platform
```

---

## 1. Prisma setup command

Jika belum pernah setup Prisma di repo:

```bash
pnpm add @prisma/client
pnpm add -D prisma
pnpm prisma init
```

---

## 2. Generate client

```bash
pnpm prisma generate
```

---

## 3. Migration

Buat migration baru dari perubahan schema:

```bash
pnpm prisma migrate dev --name init_courses
```

Jika hanya sinkron DB lokal tanpa migration file (tidak direkomendasikan untuk team):

```bash
pnpm prisma db push
```

---

## 4. Seed data

Jalankan seed:

```bash
pnpm prisma:seed
```

---

## 5. Prisma Studio (opsional)

```bash
pnpm prisma studio
```

Berguna untuk inspeksi data tanpa query manual.

---

## 6. Start app dan verifikasi mode Prisma

```bash
pnpm run start:dev
```

Cek binding aktif:

```bash
curl -s http://localhost:3000/learning/di | jq .
```

Pastikan `implementationClass` menunjukkan `PrismaCourseRepository`.

---

## 7. Verifikasi CRUD endpoint

### GET all
```bash
curl -s http://localhost:3000/courses | jq .
```

> **Catatan:** setelah Step 16, response `data` untuk daftar course berbentuk `{ items, total, page, limit }` (bukan array langsung). Query opsional `page`, `limit`, `sort`, `order`, `q` dijelaskan di `docs/step-16-relations-pagination-and-lessons.md`.

### GET one
```bash
curl -s http://localhost:3000/courses/1 | jq .
```

### POST
```bash
curl -s -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"Prisma Basics","description":"Belajar ORM Prisma di NestJS"}' | jq .
```

### PATCH
```bash
curl -s -X PATCH http://localhost:3000/courses/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Prisma Basics (Updated)"}' | jq .
```

### DELETE
```bash
curl -s -X DELETE http://localhost:3000/courses/1 | jq .
```

---

## 8. Quick troubleshooting

- Error auth DB -> cek `DATABASE_URL` (termasuk special character password harus URL-encoded).
- Error relation/table not found -> jalankan migration.
- Mode belum prisma -> cek `COURSE_REPOSITORY_IMPL=prisma` + restart app.
- Seed gagal -> cek script `prisma/seed.ts` dan koneksi DB.

