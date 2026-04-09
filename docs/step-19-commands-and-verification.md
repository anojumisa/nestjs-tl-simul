# Step 19 - Commands & Verification (Advanced Auth/Security)

Dokumen ini berisi **skenario verifikasi praktis** untuk fitur advanced auth/security yang sudah diimplementasikan pada Step 19 (plus checklist lanjutan untuk improvement production).

---

## 1. Prasyarat

- Step 18 sudah jalan (login JWT dan guard dasar berfungsi).
- Server berjalan di `http://localhost:3000`.
- `.env` sudah berisi `JWT_SECRET` dan `JWT_REFRESH_SECRET` yang aman (lihat perintah generate secret di `docs/step-18-commands-and-verification.md`).
- User seed tersedia:
  - `mentor@learning.local` / `MentorDemo123` (`admin`)
  - `student@learning.local` / `StudentDemo123` (`student`)

---

## 2. Baseline Check (fitur yang sudah ada)

### 2.1 Login berhasil dan dapat `access_token`

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mentor@learning.local","password":"MentorDemo123"}' | jq .
```

Harus mengembalikan token pada `data.access_token`.

### 2.2 Login gagal (password salah)

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mentor@learning.local","password":"salah-total"}' | jq .
```

Harus gagal dengan status `401` dan pesan generik auth error.

### 2.3 RBAC check untuk `DELETE /courses/:id`

```bash
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@learning.local","password":"StudentDemo123"}' | jq -r '.data.access_token')

curl -i -X DELETE "http://localhost:3000/courses/1" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

Harus `403 Forbidden`.

---

## 3. Verifikasi Konsep Password Hashing

Tujuan verifikasi:

- Password tidak tersimpan plaintext.
- Verifikasi dilakukan dengan compare hash, bukan string compare biasa.

Checklist:

- Pastikan proses seed/create user menyimpan `passwordHash` (bukan `password` mentah).
- Pastikan login service memakai `bcrypt.compare` pada `passwordHash`.
- Pastikan password policy minimum length tetap aktif lewat DTO validation.

> Catatan: verifikasi ini berbasis pembacaan kode + perilaku endpoint login.

---

## 4. Account Protection (Failed Auth Burst + Lockout)

Flow lockout berbasis `failedLoginAttempts` + `lockUntil` sudah aktif. Jalankan burst login gagal:

```bash
for i in {1..8}; do
  echo "Attempt $i"
  curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}\n" \
    -X POST http://localhost:3000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"mentor@learning.local","password":"wrong-password"}'
done
```

Interpretasi:

- Beberapa attempt awal akan gagal dengan `401` (invalid credentials).
- Setelah melewati threshold (`AUTH_MAX_FAILED_LOGINS`), akun akan terkunci sementara dan login benar pun ditolak sampai `AUTH_LOCK_MINUTES` berakhir.

Verifikasi unlock:

```bash
# setelah lock aktif, coba password benar (masih harus gagal sampai lock habis)
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mentor@learning.local","password":"MentorDemo123"}' | jq .
```

---

## 5. Refresh Token Flow (Implemented)

Endpoint `POST /auth/refresh` aktif dengan body `refreshToken`.

### 5.1 Ambil token dari login

```bash
LOGIN_JSON=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mentor@learning.local","password":"MentorDemo123"}')

ACCESS_TOKEN=$(echo "$LOGIN_JSON" | jq -r '.data.access_token')
REFRESH_TOKEN=$(echo "$LOGIN_JSON" | jq -r '.data.refresh_token')
echo "$ACCESS_TOKEN" | cut -c1-30
echo "$REFRESH_TOKEN" | cut -c1-30
```

### 5.2 Minta access token baru via refresh

```bash
curl -s -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

Expected:

- Mengembalikan `access_token` baru.
- Mengembalikan `refresh_token` baru (rotation).

### 5.3 Uji rotation sederhana

```bash
# Gunakan refresh token lama lagi setelah rotation
curl -s -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq .
```

Expected: gagal `401` karena hash refresh token tersimpan sudah diganti.

---

## 6. Rate Limiting Verification

Rate limit aktif di jalur courses dan juga endpoint auth (`/auth/*`).

### 6.1 Smoke test route courses

```bash
for i in {1..30}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/courses
done | sort | uniq -c
```

Amati apakah mulai muncul `429` (bergantung konfigurasi middleware demo).

### 6.2 Smoke test endpoint auth

```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"mentor@learning.local","password":"wrong-password"}'
done | sort | uniq -c
```

Amati muncul `429` saat melewati limit middleware auth.

### 6.3 Next hardening target

- `POST /auth/login` punya kebijakan limit lebih ketat dibanding endpoint umum.
- Rate limit mempertimbangkan kombinasi IP + account.

---

## 7. CSP & CSRF Verification Matrix

### 7.1 CSP (untuk browser-facing surface)

CSP baseline sudah diterapkan secara global di bootstrap app:

```bash
curl -I http://localhost:3000/docs
```

Cek header `Content-Security-Policy` ada, plus header hardening lain (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

### 7.2 CSRF

CSRF test bergantung model auth:

- Jika auth murni bearer header: fokus utama tetap XSS/token theft.
- Jika refresh/session via cookie: wajib test CSRF token + `SameSite`.

Checklist target:

- Request state-changing tanpa CSRF token ditolak (jika model cookie dipakai).
- Origin/Referer validation konsisten untuk endpoint sensitif.

---

## 8. Swagger Verification

1. Buka [http://localhost:3000/docs](http://localhost:3000/docs).
2. Login via `POST /auth/login`.
3. Klik **Authorize** dan masukkan token.
4. Verifikasi:
   - `POST /courses` berhasil dengan token valid.
   - `DELETE /courses/:id` gagal untuk role `student`.

---

## 9. Ringkasan Status Saat Ini vs Target

- **Sudah bisa diuji sekarang**: login + refresh token flow, protected routes, RBAC dasar, lockout login gagal, rate limit auth/courses, CSP baseline headers.
- **Masih target lanjutan**: refresh session-family multi-device, reuse-detection global revoke, CSRF flow final berbasis cookie, observability security production-grade.
- **Dokumen ini** berfungsi sebagai panduan uji yang langsung bisa dipakai di kelas dan sekaligus backlog hardening.

---

## 10. Referensi

- `docs/step-19-advanced-authentication-security.md`
- `docs/step-18-nestjs-authentication-authorization.md`
- `docs/step-18-commands-and-verification.md`
