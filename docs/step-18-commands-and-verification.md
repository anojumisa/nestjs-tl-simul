# Step 18 - Commands & Verification (JWT Auth)

## Prasyarat

- PostgreSQL + `DATABASE_URL` di `.env`.
- `COURSE_REPOSITORY_IMPL=prisma` (untuk konsistensi dengan seed user di database).
- Jalankan migration terbaru (kolom `password_hash` dan `role` pada `users`).

---

## 1. Environment

Tambahkan ke `.env` (lihat juga `.env.example`):

```env
JWT_SECRET=ganti-dengan-string-panjang-acak-minimal-32-karakter
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=ganti-dengan-string-panjang-acak-lainnya-minimal-32-karakter
JWT_REFRESH_EXPIRES_IN=7d
AUTH_MAX_FAILED_LOGINS=5
AUTH_LOCK_MINUTES=15
```

### Generate secret secara cepat

Pakai salah satu command di bawah untuk menghasilkan string acak kuat:

```bash
# Option A (OpenSSL) - 64 hex chars
openssl rand -hex 32

# Option B (Node.js) - 64 hex chars
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Contoh isi `.env`:

```env
JWT_SECRET=<hasil-command-pertama>
JWT_REFRESH_SECRET=<hasil-command-kedua-berbeda>
```

> Gunakan **nilai berbeda** untuk `JWT_SECRET` dan `JWT_REFRESH_SECRET`.

---

## 2. Install, migrate, seed, jalankan

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed
COURSE_REPOSITORY_IMPL=prisma JWT_SECRET=your-secret-here pnpm run start:dev
```

---

## 3. User demo (password untuk latihan)

| Email | Password | Role |
|--------|-----------|------|
| `mentor@learning.local` | `MentorDemo123` | `admin` |
| `student@learning.local` | `StudentDemo123` | `student` |

> Jangan gunakan password ini di production.

---

## 4. Login (dapatkan JWT)

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mentor@learning.local","password":"MentorDemo123"}' | jq .
```

Salin nilai `access_token` dari `data` (setelah interceptor) atau dari body mentah sesuai response app kamu. Sekarang login juga mengembalikan `refresh_token`.

Dengan interceptor sukses, bentuknya mirip:

```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { "id": 1, "email": "...", "role": "admin" }
  }
}
```

---

## 5. Endpoint publik (tanpa token)

```bash
curl -s http://localhost:3000/courses | jq .
```

---

## 6. Endpoint terlindungi (butuh JWT)

Ganti `TOKEN` dengan `access_token`.

**POST course**

```bash
curl -s -X POST http://localhost:3000/courses \
  -H "Authorization: Bearer TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Course dari user login","description":"Minimal sepuluh karakter untuk deskripsi valid."}' | jq .
```

Tanpa header → harus **401 Unauthorized**.

**PATCH course**

```bash
curl -s -X PATCH http://localhost:3000/courses/1 \
  -H "Authorization: Bearer TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Judul diubah setelah auth"}' | jq .
```

---

## 7. Authorization: DELETE hanya `admin`

Login sebagai **student**, coba hapus course → harus **403 Forbidden**.

```bash
# login student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@learning.local","password":"StudentDemo123"}' | jq -r '.data.access_token')

curl -s -X DELETE "http://localhost:3000/courses/1" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq .
```

Login sebagai **admin**, `DELETE` boleh (hati-hati menghapus data latihan).

---

## 8. Swagger

1. Buka [http://localhost:3000/docs](http://localhost:3000/docs).
2. Klik **Authorize**, isi `Bearer <token>` (atau hanya token, tergantung UI).
3. Coba `POST /courses` dari Swagger.

---

## 9. Referensi konsep

- `docs/step-18-nestjs-authentication-authorization.md`
- `docs/step-19-advanced-authentication-security.md`
