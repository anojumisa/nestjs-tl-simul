# Step 22 - Backend Deployment NestJS (Railway, Render, Fly.io)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini, kamu diharapkan:

- Mampu deploy backend NestJS project ini ke cloud.
- Mampu menyiapkan environment variables wajib agar app boot normal.
- Mampu menerapkan release flow yang aman untuk migration Prisma.
- Mampu melakukan smoke test endpoint utama setelah deploy.
- Mampu troubleshooting error umum saat startup/akses endpoint.

---

## 2. Anchor konfigurasi project ini

Sebelum deploy, pahami karakter aplikasi:

- Build command: `pnpm run build`
- Start command: `pnpm run start:prod`
- Aplikasi listen ke `process.env.PORT ?? 3000` (kompatibel dengan platform cloud)
- Prisma datasource memakai `DATABASE_URL`
- Auth membutuhkan `JWT_SECRET` dan `JWT_REFRESH_SECRET`
- Mode repository sebaiknya eksplisit: `COURSE_REPOSITORY_IMPL=prisma`

Referensi deployment dasar sebelumnya:

- `docs/step-10-simple-deployment-railway-render.md`

Referensi deployment database:

- `docs/step-21-database-deployment-railway-render-flyio.md`

---

## 3. Prasyarat sebelum deploy backend

1. Project sudah di-push ke GitHub.
2. Database production sudah tersedia (Railway/Render/Fly) dan `DATABASE_URL` sudah valid.
3. Local build sukses:

```bash
pnpm install
pnpm run build
```

4. Kamu sudah punya nilai secret aman untuk:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

---

## 4. Environment variables wajib

Minimal set variabel berikut di platform deploy:

- `DATABASE_URL` (wajib)
- `JWT_SECRET` (wajib)
- `JWT_REFRESH_SECRET` (wajib)
- `COURSE_REPOSITORY_IMPL=prisma` (sangat direkomendasikan)

Variabel tambahan sesuai kebutuhan:

- `PORT` (biasanya auto-injected platform)
- variable lockout/rate limit/auth lain jika kamu override default

> Hindari mode demo/in-memory untuk production agar perilaku konsisten dan data persisten.

---

## 5. Strategi release dan migration (penting)

Urutan yang direkomendasikan:

1. Build aplikasi.
2. Jalankan migration production:

```bash
pnpm exec prisma migrate deploy
```

3. Jalankan service backend.
4. (Opsional) seed data awal jika memang dibutuhkan:

```bash
pnpm prisma:seed
```

Catatan:

- Jangan gunakan `prisma migrate dev` di production.
- Pastikan command migration dijalankan di environment yang punya `DATABASE_URL` production.

---

## 6. Deploy backend ke Railway

### 6.1 Buat service

1. Login Railway.
2. `New Project` -> `Deploy from GitHub repo`.
3. Pilih repo ini.

### 6.2 Konfigurasi build/start

- Build command: `pnpm install && pnpm run build`
- Start command: `pnpm run start:prod`

### 6.3 Set environment variables

Masukkan semua env wajib:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `COURSE_REPOSITORY_IMPL=prisma`

### 6.4 Release migration

Gunakan salah satu pendekatan:

- Jalankan migration sebagai job/release step di Railway, atau
- Jalankan manual sekali dari environment yang sama.

Command:

```bash
pnpm exec prisma migrate deploy
```

### 6.5 Verifikasi

Setelah deploy sukses, cek endpoint:

- `GET /`
- `GET /docs`
- `GET /courses`

---

## 7. Deploy backend ke Render

### 7.1 Buat Web Service

1. Login Render.
2. `New +` -> `Web Service`.
3. Hubungkan repo GitHub.

### 7.2 Konfigurasi service

- Runtime: Node
- Build command: `pnpm install && pnpm run build`
- Start command: `pnpm run start:prod`

### 7.3 Set environment variables

Isi variabel wajib yang sama:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `COURSE_REPOSITORY_IMPL=prisma`

### 7.4 Migration saat release

Jalankan:

```bash
pnpm exec prisma migrate deploy
```

Gunakan release command/pipeline step sebelum app menerima traffic penuh.

### 7.5 Verifikasi

Cek URL service Render + path:

- `/`
- `/docs`
- `/courses`

---

## 8. Deploy backend ke Fly.io

### 8.1 Siapkan app Fly

Di root project:

```bash
fly launch
```

Ikuti prompt untuk nama app, region, dan setup awal.

### 8.2 Set secrets

Set env sebagai secret:

```bash
fly secrets set DATABASE_URL="..."
fly secrets set JWT_SECRET="..."
fly secrets set JWT_REFRESH_SECRET="..."
fly secrets set COURSE_REPOSITORY_IMPL="prisma"
```

### 8.3 Build dan deploy

Gunakan flow deploy Fly sesuai konfigurasi app:

```bash
fly deploy
```

### 8.4 Migration

Pastikan migration dijalankan terhadap database production sebelum aplikasi dianggap siap:

```bash
pnpm exec prisma migrate deploy
```

### 8.5 Verifikasi

Setelah service up:

- `GET /`
- `GET /docs`
- `GET /courses`

---

## 9. Smoke test pasca deploy (minimum)

Gunakan base URL production:

```bash
BASE_URL="https://your-app-domain"
curl -i "$BASE_URL/"
curl -i "$BASE_URL/docs"
curl -i "$BASE_URL/courses"
```

Jika auth aktif dan data user ada, lanjut uji login/refresh:

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

> Kredensial di atas contoh. Sesuaikan dengan data pada environment production kamu.

---

## 10. Hardening minimum setelah go-live

- Simpan semua secret hanya di platform secret manager.
- Nonaktifkan kebiasaan seed data demo di production rutin.
- Pastikan repository mode bukan `in-memory`/`demo-seed`.
- Pantau log error 5xx dan startup failure setelah tiap deploy.
- Siapkan rollback sederhana (redeploy versi commit sebelumnya).

---

## 11. Troubleshooting matrix

### App gagal boot, log menyebut missing env

- Cek `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` sudah terisi benar.

### App boot tapi endpoint error 500 saat akses data

- Cek koneksi DB dan migration status.
- Jalankan ulang `prisma migrate deploy`.

### `/courses` kosong padahal berharap ada data

- Tidak selalu bug; mungkin belum seed.
- Jalankan seed hanya jika use case kamu memang butuh data awal.

### Auth endpoint gagal

- Cek JWT secrets tidak kosong dan tidak tertukar.
- Cek format payload login dan data user di DB.

### Deploy sukses tapi app tidak bisa diakses

- Cek domain aktif.
- Cek health/startup log.
- Pastikan aplikasi bind ke `PORT` yang diberikan platform.

---

## 12. Tugas mandiri

1. Deploy backend ke satu provider.
2. Jalankan migration production.
3. Lakukan smoke test endpoint utama.
4. Tambahkan notes troubleshooting dari pengalamanmu.
5. Ulangi di provider kedua lalu bandingkan process time dan observability.

---

## 13. Checklist penilaian

- Service backend berhasil online di internet.
- Env vars wajib terpasang benar.
- Migration production sukses.
- Endpoint utama lolos smoke test.
- Kamu bisa menjelaskan strategi release yang aman untuk Prisma migration.

---

## 14. Referensi lanjutan

- `docs/step-10-simple-deployment-railway-render.md`
- `docs/step-21-database-deployment-railway-render-flyio.md`
- `docs/step-15-prisma-orm-integration.md`
- `docs/step-19-advanced-authentication-security.md`
