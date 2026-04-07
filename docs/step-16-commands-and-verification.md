# Step 16 - Commands & Verification

## Prasyarat

- PostgreSQL berjalan dan `DATABASE_URL` di `.env` benar (sama seperti Step 15).
- Untuk mode **Prisma**: jalankan migration yang menyertakan tabel `lessons`.

---

## 1. Migrasi & seed (Prisma)

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed
```

Jika environment sudah sinkron dan hanya perlu seed ulang:

```bash
pnpm prisma:seed
```

---

## 2. Jalankan API

```bash
COURSE_REPOSITORY_IMPL=prisma pnpm run start:dev
```

---

## 3. Verifikasi cepat (`curl`)

**Daftar course dengan pagination**

```bash
curl -s 'http://localhost:3000/courses?page=1&limit=2' | jq .
```

**Cari judul (substring)**

```bash
curl -s 'http://localhost:3000/courses?q=nest' | jq .
```

**Satu course beserta lesson**

```bash
curl -s 'http://localhost:3000/courses/1?includeLessons=true' | jq .
```

**Daftar lesson saja**

```bash
curl -s 'http://localhost:3000/courses/1/lessons' | jq .
```

**Tambah lesson**

```bash
curl -s -X POST 'http://localhost:3000/courses/1/lessons' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Lesson baru dari curl","sortOrder":99}' | jq .
```

**Hapus lesson** (ganti `LESSON_ID`)

```bash
curl -s -X DELETE "http://localhost:3000/courses/1/lessons/LESSON_ID" | jq .
```

---

## 4. Mode PostgreSQL raw (Step 14)

Pastikan tabel `lessons` ada — jalankan skrip:

`docs/sql/migrations/step-16-0003_create_lessons_table.sql`

Lalu:

```bash
COURSE_REPOSITORY_IMPL=postgres pnpm run start:dev
```

Ulangi curl di atas; perilaku list/pagination/lesson mengikuti `PostgresCourseRepository`.

---

## 5. Swagger

Buka [http://localhost:3000/docs](http://localhost:3000/docs) — tag **courses** mencakup query `ListCoursesQueryDto` dan route `courses/{courseId}/lessons`.
