# Step 14 - Curl Examples (CRUD `courses`)

Dokumen ini membantu kamu memverifikasi bahwa repository PostgreSQL sudah benar.

## 0. Persiapan

1. Jalankan migration & seed:
   - `docs/sql/migrations/step-14-0001_create_courses_table.sql`
   - `docs/sql/seeds/step-14-0002_seed_courses.sql`

2. Siapkan `.env` (direkomendasikan):

```bash
cp .env.example .env
```

Lalu isi minimal:

- `COURSE_REPOSITORY_IMPL=postgres`
- `DATABASE_URL=...` (atau `PGHOST/PGUSER/PGPASSWORD/PGDATABASE`)

3. Jalankan NestJS dengan PostgreSQL:

Contoh pakai `DATABASE_URL`:
```bash
COURSE_REPOSITORY_IMPL=postgres \
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME \
pnpm run start:dev
```

Atau pakai parameter terpisah:
```bash
COURSE_REPOSITORY_IMPL=postgres \
PGHOST=HOST PGPORT=5432 PGUSER=USER PGPASSWORD=PASSWORD PGDATABASE=DB_NAME \
pnpm run start:dev
```

Asumsi API jalan di `http://localhost:3000` (sesuaikan `PORT` kalau berbeda).

---

## 1. Read

### 1.1 `GET /courses`
```bash
curl -s http://localhost:3000/courses | jq
```

### 1.2 `GET /courses/:id`
```bash
curl -s http://localhost:3000/courses/1 | jq
```

---

## 2. Create

### 2.1 `POST /courses`
```bash
curl -s -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Praktik CRUD ke PostgreSQL",
    "description": "Testing create via raw SQL repository"
  }' | jq
```

Catatan: respon harus berisi `id`, `title`, `description`.

---

## 3. Update

### 3.1 `PATCH /courses/:id`
```bash
curl -s -X PATCH http://localhost:3000/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title (via PostgreSQL)"
  }' | jq
```

---

## 4. Delete

### 4.1 `DELETE /courses/:id`
```bash
curl -s -X DELETE http://localhost:3000/courses/1 | jq
```

Respon yang diharapkan:
```json
{ "message": "Course with id 1 deleted" }
```

---

## 5. Validasi cepat di database

Setelah setiap operasi (create/update/delete), kamu bisa cek langsung di DB:

```sql
SELECT id, title, description, created_at, updated_at
FROM courses
ORDER BY id ASC;
```

