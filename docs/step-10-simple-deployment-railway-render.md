# Step 10 – Simple Deployment (Railway & Render)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** alur deploy backend NestJS ke cloud (tanpa Docker dulu).
- **Mampu deploy** API yang sudah kita bangun ke **Railway** dan/atau **Render**.
- **Mampu verifikasi** endpoint production (`/`, `/courses`, `/docs`, `/learning/di`).
- **Memahami** konsep penting deployment: `PORT`, build command, start command, dan environment variable.

---

## 2. Kenapa perlu belajar deployment?

Selama development, API berjalan di lokal (`localhost`). Di project nyata, backend harus bisa diakses oleh frontend/mobile/client lain lewat internet.

Deployment membantu kita:

- berbagi API ke tim/mentor/QA,
- menguji perilaku di environment production,
- menyiapkan fondasi untuk CI/CD nanti.

---

## 3. Checklist sebelum deploy

Pastikan di lokal sudah lolos:

1. Install dependency:

```bash
pnpm install
```

2. Build sukses:

```bash
pnpm run build
```

3. Jalankan lokal:

```bash
pnpm run start:dev
```

4. Endpoint minimal jalan:

- `GET /`
- `GET /courses`
- `GET /docs`
- `GET /learning/di`

> Project ini sudah membaca `process.env.PORT ?? 3000`, jadi aman untuk platform cloud.

---

## 4. Ringkasan konfigurasi yang dipakai di repo ini

Dari `package.json`:

- **Build Command**: `pnpm run build`
- **Start Command**: `pnpm run start:prod` (yang menjalankan `node dist/main`)

Dari `src/main.ts`:

- Aplikasi listen ke `process.env.PORT`.

Ini sudah cukup untuk deploy sederhana di Railway dan Render.

---

## 5. Deploy ke Railway

### 5.1. Persiapan

- Push project ke GitHub (branch yang ingin dideploy).
- Login ke Railway.

### 5.2. Buat project baru

1. Klik **New Project**.
2. Pilih **Deploy from GitHub repo**.
3. Pilih repository `nestjs-demo`.

Railway biasanya auto-detect Node.js project.

### 5.3. Set konfigurasi (jika belum terdeteksi)

- **Build Command**: `pnpm run build`
- **Start Command**: `pnpm run start:prod`

### 5.4. Environment variables (opsional untuk demo DI)

Tambahkan jika ingin demo swap repository (lihat Step 09):

- `COURSE_REPOSITORY_IMPL=demo-seed`

Jika tidak diisi, default tetap `InMemoryCourseRepository`.

### 5.5. Deploy & ambil URL

- Tunggu status deploy sukses.
- Railway akan memberi domain public (misalnya `https://<app>.up.railway.app`).

### 5.6. Verifikasi endpoint

Coba akses:

- `/`
- `/courses`
- `/docs`
- `/learning/di`

> Gunakan URL dari Railway + path di atas.

---

## 6. Deploy ke Render

### 6.1. Persiapan

- Login ke Render.
- Repo sudah ada di GitHub.

### 6.2. Buat Web Service

1. Klik **New +** → **Web Service**.
2. Connect GitHub repo.
3. Pilih repo `nestjs-demo`.

### 6.3. Isi konfigurasi service

- **Runtime**: Node
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm run start:prod`

Render menyediakan `PORT` otomatis. Kode kita sudah kompatibel.

### 6.4. Environment variables (opsional)

- `COURSE_REPOSITORY_IMPL=demo-seed` (untuk menunjukkan DI swap implementation).

### 6.5. Deploy & verifikasi

Setelah live, cek:

- `/`
- `/courses`
- `/docs`
- `/learning/di`

---

## 7. Demo cepat di kelas (5 menit)

Gunakan urutan ini saat mentoring:

1. Tunjukkan API lokal jalan (`/docs`).
2. Buka URL Railway/Render → endpoint sama.
3. Buka `/learning/di` dan jelaskan binding aktif.
4. Set env `COURSE_REPOSITORY_IMPL=demo-seed` di provider cloud.
5. Redeploy, lalu `GET /courses` lagi.
6. Tunjukkan: **`CoursesService` tidak berubah, output berubah karena DI provider**.

Pesan utama:

> Deployment bukan hanya “hosting”, tapi juga menunjukkan kekuatan arsitektur (DI + env-based wiring).

---

## 8. Troubleshooting umum

### 8.1. Build gagal karena dependency

- Pastikan lockfile sinkron.
- Jalankan lokal dulu:

```bash
pnpm install
pnpm run build
```

### 8.2. App tidak bisa start (crash loop)

- Cek apakah start command benar: `pnpm run start:prod`.
- Pastikan `dist/main.js` terbentuk setelah build.

### 8.3. Endpoint hidup tapi tidak sesuai ekspektasi

- Cek env `COURSE_REPOSITORY_IMPL`.
- Buka `/learning/di` untuk melihat implementasi aktif.

### 8.4. `/docs` tidak tampil

- Pastikan aplikasi berhasil boot sampai `SwaggerModule.setup('docs', ...)` terpanggil.

---

## 9. Tugas mandiri (wajib)

1. Deploy ke **salah satu** platform (Railway atau Render), kirim URL.
2. Tunjukkan screenshot `GET /docs` dan `GET /courses` di URL production.
3. Aktifkan `COURSE_REPOSITORY_IMPL=demo-seed`, redeploy, dan jelaskan perubahan output.
4. Tulis catatan singkat:
   - 2 hal yang paling mudah saat deploy,
   - 2 masalah yang kamu temui dan cara mengatasinya.

---

## 10. Checklist penilaian

Kamu dianggap **lulus Step 10** jika:

- [ ] Bisa deploy backend ke cloud (Railway/Render).
- [ ] Bisa menjelaskan build command vs start command.
- [ ] Bisa memverifikasi endpoint utama di production.
- [ ] Bisa menunjukkan contoh perubahan perilaku via environment variable.
- [ ] Paham kaitan deployment dengan praktik arsitektur backend yang rapi.

---

## 11. Next step (preview)

Setelah ini, materi yang cocok adalah:

- **Step 11 – Environment & Config Management** (misalnya `@nestjs/config`, `.env`, validation).
- **Step 12 – Database production** (Prisma + PostgreSQL managed service).
- **Step 13 – Basic CI/CD** (auto deploy dari GitHub push).

