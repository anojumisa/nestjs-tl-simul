# Step 21 - Database Deployment (PostgreSQL di Railway, Render, Fly.io)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini, kamu diharapkan:

- Memahami opsi deployment PostgreSQL untuk project NestJS ini.
- Mampu provisioning database di Railway, Render, dan Fly.io.
- Mampu menyiapkan `DATABASE_URL` yang kompatibel dengan Prisma.
- Mampu menjalankan migration production dengan aman.
- Mampu melakukan verifikasi koneksi aplikasi ke database cloud.

---

## 2. Konteks project ini

Repository ini menggunakan PostgreSQL via Prisma:

- `prisma/schema.prisma` membaca koneksi dari `env("DATABASE_URL")`.
- `prisma.config.ts` juga mengandalkan `DATABASE_URL` saat menjalankan Prisma CLI.
- Mode repository yang direkomendasikan untuk production adalah `COURSE_REPOSITORY_IMPL=prisma`.

Panduan deployment backend dasar sebelumnya ada di:

- `docs/step-10-simple-deployment-railway-render.md`

Step ini fokus ke deployment database. Deployment backend dibahas lanjut di Step 22.

---

## 3. Kapan pilih provider mana?

### Railway

Cocok jika kamu ingin setup cepat untuk belajar/demo, UI sederhana, dan integrasi mudah dengan service backend di platform yang sama.

### Render

Cocok jika kamu ingin workflow managed service yang rapi (database + web service), dengan setting cukup jelas untuk environment team kecil.

### Fly.io

Cocok jika kamu butuh kontrol region/infra lebih detail dan nyaman dengan CLI-first workflow.

> Untuk pembelajaran, ketiganya valid. Pilih satu provider dulu sampai end-to-end berhasil, baru bandingkan provider lain.

---

## 4. Prasyarat sebelum provisioning DB

1. Project sudah bisa jalan lokal.
2. Prisma sudah terpasang (sudah ada di repo ini).
3. Kamu paham command berikut:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed
```

4. Siapkan `.env` lokal untuk verifikasi:

```bash
cp .env.example .env
```

---

## 5. Standar output yang harus kamu simpan

Setelah membuat database di provider mana pun, simpan:

- `DATABASE_URL` (wajib)
- Host
- Port
- Database name
- Username
- Password
- SSL mode requirement (misalnya perlu `sslmode=require`)

Kenapa perlu detail breakdown?

- Saat `DATABASE_URL` gagal dipakai, kamu bisa debug menggunakan parameter terpisah.
- Beberapa provider memberi URL internal dan URL external; kamu perlu tahu mana yang dipakai oleh app.

### 5.1 Format `DATABASE_URL` (PostgreSQL)

Format umum:

```text
postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
```

Contoh:

```text
postgresql://myuser:mypassword@db.example.com:5432/learning_platform
```

Jika provider mewajibkan SSL, biasanya ditambahkan sebagai query param:

```text
postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require
```

Catatan penting:

- Jika `PASSWORD` mengandung karakter spesial (misalnya `@`, `:`, `/`, `#`), lakukan URL-encode terlebih dulu.
- Beberapa provider memberi 2 jenis URL:
  - **Direct connection** (lebih cocok untuk migration/CLI Prisma)
  - **Pooled/transaction** (lebih cocok untuk runtime aplikasi pada skala tertentu)
- Untuk project ini, Prisma datasource membaca `DATABASE_URL` dari environment (`prisma/schema.prisma`), jadi format di atas adalah yang utama.

---

## 6. Setup PostgreSQL di Railway

### 6.1 Buat database

1. Login ke Railway.
2. Buat project baru.
3. Tambahkan service `PostgreSQL`.

### 6.2 Ambil connection info

Di tab variables/settings database, ambil:

- `DATABASE_URL` (utamakan ini untuk Prisma)
- host/user/password/database/port

### 6.3 Perhatikan network

- Jika backend juga di Railway project yang sama, utamakan koneksi internal.
- Jika backend di platform lain, gunakan endpoint external yang diizinkan.

### 6.4 Verifikasi dari lokal (opsional tapi direkomendasikan)

Masukkan `DATABASE_URL` ke `.env`, lalu:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

Jika sukses, schema production sudah terbentuk.

---

## 7. Setup PostgreSQL di Render

### 7.1 Buat PostgreSQL instance

1. Login ke Render.
2. Klik `New +` -> `PostgreSQL`.
3. Pilih name, region, dan plan sesuai kebutuhan.

### 7.2 Ambil connection string

Setelah instance ready, simpan:

- External database URL
- Internal database URL (jika backend juga di Render)

### 7.3 SSL dan akses

- Pastikan format URL sesuai kebutuhan Prisma.
- Jika provider mewajibkan SSL, gunakan parameter SSL di URL yang disediakan Render.

### 7.4 Verifikasi migration

Gunakan `.env` lokal yang berisi URL dari Render:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

---

## 8. Setup PostgreSQL di Fly.io

### 8.1 Prasyarat Fly CLI

Install dan login Fly CLI:

```bash
fly auth login
```

### 8.2 Provision PostgreSQL

Contoh command:

```bash
fly postgres create
```

Ikuti prompt untuk app name, region, dan resource.

### 8.3 Ambil connection details

Setelah cluster jadi, ambil secret/connection string yang disediakan Fly.

Jika backend di Fly juga, biasanya tersedia jalur private network yang lebih aman.

### 8.4 Verifikasi migration

Set `DATABASE_URL` ke nilai dari Fly lalu jalankan:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

---

## 9. Setup PostgreSQL di Supabase

### 9.1 Buat project Supabase

1. Login ke Supabase.
2. Klik `New project`.
3. Pilih organization, region, dan isi password database.

### 9.2 Ambil connection string

Dari `Project Settings` -> `Database`, ambil connection string PostgreSQL.

Rekomendasi untuk Prisma:

- Gunakan URI format yang disarankan Supabase untuk direct connection.
- Jika ada opsi pooled vs direct, utamakan direct untuk migration CLI.

### 9.3 Verifikasi migration

Set `DATABASE_URL` dari Supabase ke `.env`, lalu jalankan:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

### 9.4 Catatan khusus Supabase

- Pastikan password database tidak mengandung karakter yang belum di-URL-encode.
- Jika koneksi gagal, cek host, port, user, dan SSL requirement dari panel Supabase.

---

## 10. Setup PostgreSQL di Neon

### 10.1 Buat project Neon

1. Login ke Neon.
2. Buat project baru.
3. Neon akan membuat database + branch default.

### 10.2 Ambil connection string

Dari dashboard Neon, copy connection string PostgreSQL.

Catatan:

- Neon biasanya menyediakan mode pooled/direct.  
- Untuk migration Prisma, direct connection lebih aman untuk command migration.

### 10.3 Verifikasi migration

Set `DATABASE_URL` dari Neon ke `.env`, lalu jalankan:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

### 10.4 Catatan khusus Neon

- Jika memakai branching database Neon, pastikan kamu migrate di branch yang benar.
- Saat production, gunakan koneksi branch production, bukan branch testing.

---

## 11. CLI commands (opsional) untuk workflow database

Jika kamu ingin alur command-line (bukan klik dashboard saja), gunakan referensi cepat ini.

### 11.1 Railway (CLI)

```bash
# install (jika belum)
npm i -g @railway/cli

# login dan link ke project Railway
railway login
railway link

# lihat variable project/service
railway variables
```

Catatan:

- Provision PostgreSQL biasanya tetap paling mudah lewat dashboard Railway.
- Setelah DB jadi, gunakan `DATABASE_URL` yang diberikan untuk flow Prisma di bawah.

### 11.2 Fly.io (CLI-first)

```bash
# login
fly auth login

# buat postgres cluster
fly postgres create

# lihat daftar postgres app
fly postgres list
```

Jika perlu cek koneksi:

```bash
fly postgres connect -a <nama-postgres-app>
```

### 11.3 Supabase (CLI)

```bash
# install Supabase CLI (opsi npm)
npm i -g supabase

# login
supabase login

# link project (butuh project-ref dari dashboard)
supabase link --project-ref <project-ref>
```

Catatan:

- Provision DB Supabase tetap paling mudah via dashboard.
- CLI Supabase berguna untuk workflow project dan integration, sedangkan `DATABASE_URL` tetap diambil dari project settings.

### 11.4 Neon (CLI)

Neon lebih umum dipakai via dashboard/API untuk provisioning awal.
Jika kamu memakai Neon CLI di environment kamu, pastikan:

- sudah login/auth,
- project dan branch target sudah benar,
- connection string yang dipakai adalah branch yang memang ingin dideploy.

### 11.5 Prisma migration dari CLI lokal

Setelah `DATABASE_URL` siap, jalankan:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

Untuk data awal (opsional):

```bash
pnpm prisma:seed
```

---

## 12. Migration strategy untuk production

Gunakan prinsip ini:

- Wajib: `prisma migrate deploy` pada environment target.
- Jangan pakai `prisma migrate dev` di production.
- `prisma:seed` adalah opsional (misalnya butuh data demo awal).

Flow aman:

1. Deploy DB.
2. Jalankan `prisma migrate deploy`.
3. (Opsional) jalankan seed.
4. Baru deploy backend atau pastikan backend restart dengan schema terbaru.

---

## 13. Checklist keamanan database

- Gunakan password kuat (bukan default/sederhana).
- Simpan credential di secret manager platform, bukan hardcode di repo.
- Batasi akses network (allowlist/private network) jika memungkinkan.
- Rotasi credential secara berkala.
- Pisahkan database dev/staging/prod.

---

## 14. Verifikasi koneksi dari aplikasi

Set env di backend:

- `DATABASE_URL=<url provider>`
- `COURSE_REPOSITORY_IMPL=prisma`

Jalankan backend, lalu cek endpoint:

```bash
curl -s http://localhost:3000/learning/di | jq .
curl -s http://localhost:3000/courses | jq .
```

Jika implementasi repository menunjukkan Prisma dan endpoint berhasil mengembalikan data, koneksi DB valid.

---

## 15. Troubleshooting cepat

### Error: authentication failed

- Cek username/password di URL.
- Cek apakah password berubah tetapi secret backend belum di-update.

### Error: connection refused / timeout

- Cek host/port.
- Cek policy network (private-only vs public access).

### Error: SSL required

- Tambahkan SSL parameter sesuai provider di `DATABASE_URL`.

### Error: migration drift / table belum ada

- Pastikan command yang dijalankan adalah `prisma migrate deploy`.
- Cek log migration untuk SQL yang gagal.

### Error: app jalan tapi data kosong

- Ini bisa normal jika belum seed.
- Jalankan `pnpm prisma:seed` jika memang butuh data awal.

---

## 16. Tugas mandiri

1. Provision PostgreSQL di salah satu provider.
2. Simpan `DATABASE_URL` dan detail breakdown koneksi.
3. Jalankan `prisma migrate deploy`.
4. Jalankan backend dengan `COURSE_REPOSITORY_IMPL=prisma`.
5. Verifikasi endpoint `GET /courses`.
6. Ulangi di provider kedua, lalu bandingkan pengalaman setup.

---

## 17. Checklist penilaian

- Database berhasil terprovision.
- `DATABASE_URL` valid dan tersimpan aman.
- Migration production sukses tanpa error.
- Backend berhasil connect ke DB provider.
- Kamu bisa menjelaskan perbedaan Railway, Render, Fly.io, Supabase, dan Neon untuk use case kamu.

---

## 18. Next Step

Lanjut ke deployment backend lengkap:

- `docs/step-22-backend-deployment-railway-render-flyio.md`

Untuk referensi deployment dasar yang lebih ringkas:

- `docs/step-10-simple-deployment-railway-render.md`
