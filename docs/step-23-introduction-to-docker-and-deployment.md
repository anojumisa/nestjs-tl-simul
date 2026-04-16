# Step 23 - Introduction to Docker for Deployment

## 1. Tujuan Belajar

Setelah menyelesaikan step ini, kamu diharapkan:

- Memahami kenapa Docker dibutuhkan setelah belajar managed deployment.
- Memahami konsep image, container, dan Dockerfile untuk backend NestJS.
- Mampu menjalankan backend ini di container secara lokal.
- Mampu melakukan deploy container ke Render.
- Mampu menjelaskan perbedaan deploy managed runtime vs deploy berbasis container.

---

## 2. Prasyarat cepat sebelum mulai

Pastikan environment belajar siap:

```bash
docker --version
docker compose version
```

Yang perlu kamu cek:

- Docker Engine aktif (Docker Desktop atau daemon Docker berjalan).
- User kamu punya izin menjalankan command Docker.
- Port `3000` lokal tidak dipakai proses lain.

---

## 3. Kenapa Docker untuk deployment?

Di step sebelumnya, kita deploy backend dengan managed infrastructure. Itu bagus untuk mulai cepat. Lalu kenapa masih perlu Docker?

### 2.1 Masalah umum tanpa Docker

- Environment drift: versi Node/dependency beda antara laptop, CI, dan server.
- "Works on my machine": aplikasi jalan lokal tapi gagal saat deploy.
- Runtime mismatch: cara build/start berbeda antar platform.

### 2.2 Manfaat Docker untuk deployment

- Portability: satu image yang sama bisa dijalankan di banyak environment.
- Reproducibility: behavior lebih konsisten karena runtime dibungkus.
- Release consistency: dev, QA, dan production memakai artefak yang sama.
- Onboarding lebih mudah: tim cukup build/run container yang sama.

### 2.3 Trade-off yang perlu dipahami

- Ada layer tooling baru (Dockerfile, image lifecycle).
- Build image bisa lebih lambat jika Dockerfile tidak efisien.
- Kamu bertanggung jawab menjaga keamanan image base dan dependencies.

---

## 4. Konsep inti Docker untuk backend NestJS

### 3.1 Image vs Container

- Image: blueprint read-only berisi app + runtime + dependencies.
- Container: instance yang berjalan dari image.

### 3.2 Dockerfile

Dockerfile adalah resep untuk membangun image. Di sini kita akan:

- Install dependency dengan `pnpm`.
- Build NestJS (`pnpm run build`).
- Menjalankan app production (`pnpm run start:prod`).

### 3.3 Build-time vs Runtime config

- Build-time (`ARG`): dipakai saat image build.
- Runtime (`ENV`): dipakai saat container berjalan (contoh: `DATABASE_URL`, JWT secrets).

Untuk project ini, konfigurasi penting diperlakukan sebagai runtime env.

### 3.4 Container networking dan PORT

App ini listen ke `process.env.PORT ?? 3000`. Saat container dijalankan, pastikan mapping port benar (`-p hostPort:containerPort`) dan platform production memberi `PORT`.

---

## 5. Alur besar build-run-deploy

```mermaid
flowchart LR
    SourceCode["NestJS SourceCode"] -->|docker build| DockerImage["DockerImage:nestjs-demo:step23"]
    DockerImage -->|docker run| LocalContainer["LocalContainer (port3000)"]
    DockerImage -->|push/deploy| RenderService["RenderWebService"]
    RenderService --> ProductionTraffic["ProductionTraffic"]
```

Inti alurnya:

- `docker build` membuat image (artefak).
- `docker run` menjalankan artefak sebagai container.
- Platform seperti Render bisa deploy langsung dari `Dockerfile` untuk membangun image serupa di cloud.

---

## 6. Hands-on lokal: Dockerize NestJS app

### 6.1 Dockerfile dan docker ignore sudah tersedia di repo

Repo ini sudah menyediakan:

- `Dockerfile`
- `.dockerignore`

Kamu bisa membacanya dulu untuk memahami alurnya (install dependency, `prisma:generate`, build NestJS, lalu start production).

Jika kamu ingin membandingkan dengan versi minimal, berikut bentuk baseline-nya:

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma:generate
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
```

Catatan:

- `pnpm prisma:generate` dilakukan saat build image agar Prisma Client siap dipakai.
- `DATABASE_URL` tetap diberikan saat runtime container.

### 6.2 Build image lokal

```bash
docker build -t nestjs-demo:step23 .
```

### 6.3 Jalankan dengan Docker Compose (app + Postgres lokal)

Repo juga menyediakan `docker-compose.yml` untuk menjalankan:

- `db` (PostgreSQL)
- `app` (NestJS)
- tool profile: `migrate` dan `seed`

Jalankan stack:

```bash
docker compose up -d
```

Jalankan migration (opsional, jika DB masih kosong):

```bash
docker compose --profile tools run --rm migrate
```

Seed data (opsional):

```bash
docker compose --profile tools run --rm seed
```

Lihat log:

```bash
docker compose logs -f app
```

### 6.4 Jalankan container lokal

Contoh:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME" \
  -e JWT_SECRET="replace-with-strong-secret" \
  -e JWT_REFRESH_SECRET="replace-with-strong-refresh-secret" \
  -e COURSE_REPOSITORY_IMPL="prisma" \
  nestjs-demo:step23
```

### 6.5 Smoke test lokal

Di terminal lain:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/docs
curl -i http://localhost:3000/courses
```

Jika endpoint merespons normal, container local run sudah benar.

### 6.6 Catatan penting DB lokal vs DB cloud

Saat menjalankan container lokal, ada dua pola koneksi database:

- **Pola A (direkomendasikan awal):** container app lokal terhubung ke database cloud via `DATABASE_URL`.
- **Pola B (lanjutan):** container app terhubung ke database lokal (butuh Docker Compose/networking tambahan).

Jika kamu baru belajar Docker, pakai Pola A dulu agar fokus ke konsep container app.

---

## 7. Deploy container ke Render

### 7.1 Buat service dari repo GitHub

1. Login ke Render.
2. Klik `New +` -> `Web Service`.
3. Connect repository ini.
4. Pilih mode deploy yang membaca `Dockerfile`.

### 7.2 Konfigurasi runtime di Render

Set environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `COURSE_REPOSITORY_IMPL=prisma`

`PORT` biasanya disediakan Render otomatis.

### 7.3 Strategi migration saat release

Sebelum app menerima traffic penuh, jalankan migration production:

```bash
pnpm exec prisma migrate deploy
```

Gunakan release command atau job terpisah sesuai workflow tim.

#### Migration ownership (siapa yang menjalankan migration?)

Pilihan yang lebih aman untuk production:

- **Release job terpisah:** migration dijalankan sekali per rilis (recommended).
- **Manual one-off migration:** dijalankan operator sebelum cutover traffic.

Kurang direkomendasikan:

- Menjalankan migration di startup app utama. Risiko race condition saat scale-out (beberapa instance start bersamaan).

### 7.4 Verifikasi pasca deploy

Uji endpoint:

- `GET /`
- `GET /docs`
- `GET /courses`

Jika perlu auth flow, lanjut uji endpoint login/refresh.

---

## 8. Troubleshooting umum Docker + deploy

### Container langsung exit

- Cek command start di Dockerfile (`pnpm run start:prod`).
- Cek log untuk error build artifact (`dist/` tidak ada).

### App error karena env hilang

- Pastikan `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` tersedia di runtime.

### Port mismatch

- Lokal: pastikan `-p 3000:3000`.
- Render: pastikan app bind ke `PORT` dari platform.

### Migration belum ter-apply

- Jalankan `pnpm exec prisma migrate deploy` pada environment production.
- Jangan pakai `prisma migrate dev` di production.

### Build image lambat

- Susun Dockerfile agar layer dependency bisa di-cache (`COPY package*.json/pnpm-lock` lebih awal).

---

## 9. Managed runtime vs Dockerized runtime (step 22 vs step 23)

| Aspek | Managed runtime (Step 22) | Dockerized runtime (Step 23) |
|------|-----------------------------|-------------------------------|
| Artefak deploy | Source code + build command platform | Docker image hasil Dockerfile |
| Kontrol environment | Lebih banyak diatur platform | Lebih banyak kamu definisikan |
| Portabilitas | Cukup baik, tapi vendor-specific behavior mungkin ada | Tinggi, image yang sama bisa jalan lintas platform |
| Debugging | Fokus ke log app/platform | Tambah layer debug image/container |
| Cocok untuk | Start cepat, learning awal | Konsistensi env dan kesiapan production tim |

Dalam praktik, banyak tim memakai keduanya: managed platform + deploy via Docker image.

---

## 10. Common mistake lab (latihan debugging)

### Kasus 1: Env wajib tidak diisi

Simulasi:

- Jalankan container tanpa `JWT_SECRET`.

Ekspektasi:

- App gagal boot.

Yang harus diamati:

- Log error startup menunjukkan variabel env yang hilang.

### Kasus 2: Port mapping salah

Simulasi:

- Jalankan `docker run -p 3001:3000 ...` tapi test ke `localhost:3000`.

Ekspektasi:

- Request gagal karena host port yang benar adalah `3001`.

### Kasus 3: Migration belum dijalankan

Simulasi:

- Deploy app ke DB kosong tanpa `prisma migrate deploy`.

Ekspektasi:

- Endpoint data bisa error karena tabel belum ada.

---

## 11. Improvement path Dockerfile (preview next level)

Setelah baseline berhasil, tingkatkan secara bertahap:

- Gunakan multi-stage build untuk image lebih kecil.
- Jalankan app dengan non-root user.
- Tambahkan `.dockerignore` agar build context lebih kecil dan cepat.
- Pin versi base image dan update berkala untuk security patch.

---

## 12. Tugas mandiri

1. Buat `Dockerfile` seperti baseline step ini.
2. Build image dan jalankan container lokal.
3. Verifikasi endpoint `/`, `/docs`, `/courses`.
4. Deploy container ke Render.
5. Tulis perbandingan singkat: deploy Step 22 vs deploy Docker Step 23.

---

## 13. Checklist penilaian

- Bisa menjelaskan alasan Docker untuk deployment.
- Image berhasil dibuild lokal.
- Container berhasil jalan dengan env runtime yang benar.
- Deploy container ke Render berhasil.
- Endpoint utama lolos smoke test setelah deploy.

---

## 14. Pertanyaan refleksi

Diskusikan dengan mentor/kelompok:

1. Jika Docker portable, kenapa deploy masih bisa gagal antar environment?
2. Kapan kamu memilih managed runtime tanpa Docker, dan kapan wajib Docker?
3. Kenapa migration di startup app utama berisiko saat service di-scale?

---

## 15. Glosarium singkat

- **Image:** template immutable untuk membuat container.
- **Container:** proses aplikasi yang berjalan dari image.
- **Layer:** hasil tiap instruksi Dockerfile yang bisa di-cache.
- **Registry:** tempat menyimpan image (misalnya Docker Hub, GHCR).
- **Tag:** penanda versi image (misalnya `app:1.0.0`).
- **Build context:** file/folder yang dikirim saat `docker build`.

---

## 16. Referensi

- `docs/step-21-database-deployment-railway-render-flyio.md`
- `docs/step-22-backend-deployment-railway-render-flyio.md`
- [Docker Docs](https://docs.docker.com/)
- [Render Docker Deploy Docs](https://render.com/docs/docker)
