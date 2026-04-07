# Step 17 - Commands & Verification (Prisma Relationships)

## Prasyarat

- PostgreSQL berjalan dan `DATABASE_URL` di `.env` valid.
- Aktifkan Prisma mode:
  - `COURSE_REPOSITORY_IMPL=prisma`

---

## 1. Generate, migrate, seed

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed
```

---

## 2. Jalankan API

```bash
COURSE_REPOSITORY_IMPL=prisma pnpm run start:dev
```

---

## 3. Verifikasi relasi 1:1 (User <-> UserProfile)

### Buat user + profile

```bash
curl -s -X POST 'http://localhost:3000/learning/relations/one-to-one/users' \
  -H 'Content-Type: application/json' \
  -d '{"email":"new-mentor@learning.local","fullName":"New Mentor","bio":"Demo 1:1"}' | jq .
```

### Ambil user + profile

Ganti `USER_ID` dari response sebelumnya.

```bash
curl -s 'http://localhost:3000/learning/relations/one-to-one/users/USER_ID' | jq .
```

---

## 4. Verifikasi relasi 1:N dan N:1 (Course <-> Lesson)

```bash
curl -s 'http://localhost:3000/courses/1?includeLessons=true' | jq .
curl -s 'http://localhost:3000/courses/1/lessons' | jq .
```

Tambah lesson:

```bash
curl -s -X POST 'http://localhost:3000/courses/1/lessons' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Relasi 1:N via endpoint","sortOrder":20}' | jq .
```

---

## 5. Verifikasi relasi N:M (Student <-> Course via Enrollment)

### Enroll student ke course

```bash
curl -s -X POST 'http://localhost:3000/learning/relations/many-to-many/enrollments' \
  -H 'Content-Type: application/json' \
  -d '{"studentId":1,"courseId":2}' | jq .
```

Jika student sudah terdaftar di course yang sama, API akan mengembalikan conflict.

### Ambil student + daftar course

```bash
curl -s 'http://localhost:3000/learning/relations/many-to-many/students/1' | jq .
```

### Ambil course + daftar student

```bash
curl -s 'http://localhost:3000/learning/relations/many-to-many/courses/1' | jq .
```

---

## 6. Cek repository mode + list query

```bash
curl -s 'http://localhost:3000/learning/di' | jq .
curl -s 'http://localhost:3000/courses?page=1&limit=2&sort=title&order=asc&q=nest' | jq .
```

---

## 7. Referensi

- Konsep: `docs/step-17-prisma-relationship-patterns.md`
- Relasi Course/Lesson: `docs/step-16-relations-pagination-and-lessons.md`
