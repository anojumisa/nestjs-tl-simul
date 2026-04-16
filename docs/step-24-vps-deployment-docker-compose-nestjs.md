# Step 24 - VPS Deployment dengan Docker Compose (NestJS)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini, kamu diharapkan:

- Memahami perbedaan deployment managed platform vs VPS (self-managed).
- Mampu menyiapkan VPS dengan security baseline untuk menjalankan backend.
- Mampu deploy NestJS menggunakan Docker Compose di VPS.
- Mampu menempatkan Nginx sebagai reverse proxy dan mengaktifkan HTTPS.
- Mampu melakukan verifikasi, troubleshooting, dan rollback dasar.

---

## 2. Kenapa belajar VPS setelah Step 23?

Di Step 23 kamu sudah belajar containerization dan deploy container ke platform managed.

Belajar VPS melatih skill tambahan:

- kontrol penuh OS, jaringan, dan service,
- optimasi biaya dengan resource yang kamu atur sendiri,
- kesiapan operasional production yang lebih realistis.

Trade-off:

- kamu juga bertanggung jawab untuk patching OS, firewall, monitoring, backup, dan security hardening.

---

## 3. Kapan pilih managed vs VPS?

| Opsi | Kontrol | Ops effort | Kecepatan start | Cocok untuk |
|------|---------|------------|-----------------|-------------|
| Managed runtime | Rendah-sedang | Rendah | Sangat cepat | Belajar awal, MVP cepat |
| Docker di managed platform | Sedang | Sedang | Cepat | Konsistensi environment + tetap praktis |
| Docker di VPS | Tinggi | Tinggi | Lebih lambat di awal | Butuh kontrol infra, optimasi biaya, belajar DevOps |

Rule of thumb:

- Ingin fokus fitur produk -> managed runtime.
- Ingin konsistensi artefak deploy -> Docker di managed.
- Ingin kontrol penuh infra + networking -> VPS.

---

## 4. Arsitektur target yang dibangun

```mermaid
flowchart LR
    Internet["Internet User"] --> DomainDNS["DomainDNS"]
    DomainDNS --> NginxProxy["NginxReverseProxy (80/443)"]
    NginxProxy --> NestContainer["NestJSContainer (3000)"]
    NestContainer --> ManagedPostgres["PostgreSQL (Managed)"]
```

Catatan:

- Pada step ini, fokus app di VPS dan database tetap managed PostgreSQL (lebih aman untuk tahap belajar).
- Setelah paham alur ini, kamu bisa eksplor DB juga di VPS sebagai materi lanjutan.

---

## 5. Prasyarat

1. Sudah mengikuti:
   - `docs/step-21-database-deployment-railway-render-flyio.md`
   - `docs/step-22-backend-deployment-railway-render-flyio.md`
   - `docs/step-23-introduction-to-docker-and-deployment.md`
2. Punya VPS Ubuntu (disarankan 22.04+) dengan akses SSH.
3. Punya domain yang bisa diarahkan ke IP VPS (direkomendasikan untuk HTTPS).
4. Aplikasi sudah bisa build lokal:

```bash
pnpm install
pnpm run build
```

---

## 6. Security baseline VPS (wajib)

Lakukan hardening minimum sebelum deploy app.

### 6.1 Update package sistem

```bash
sudo apt update && sudo apt upgrade -y
```

### 6.2 Buat user non-root

```bash
sudo adduser deployer
sudo usermod -aG sudo deployer
```

### 6.3 Setup SSH key + matikan password login (setelah key teruji)

- Tambahkan public key ke `~/.ssh/authorized_keys` user deployer.
- Di `sshd_config`, nonaktifkan password auth jika sudah aman:
  - `PasswordAuthentication no`
  - `PermitRootLogin no`

### 6.4 Aktifkan firewall dasar (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 7. Install Docker dan Docker Compose plugin

Ikuti panduan resmi Docker untuk Ubuntu. Setelah install:

```bash
docker --version
docker compose version
```

Opsional (agar tidak perlu `sudo`):

```bash
sudo usermod -aG docker $USER
```

Logout-login kembali agar group aktif.

---

## 8. Struktur deployment di VPS

Buat folder deploy:

```bash
sudo mkdir -p /opt/nestjs-demo
sudo chown -R $USER:$USER /opt/nestjs-demo
cd /opt/nestjs-demo
```

Contoh struktur:

```text
/opt/nestjs-demo
  ├── docker-compose.yml
  ├── .env.production
  └── nginx/
      └── default.conf
```

---

## 9. Siapkan environment variables production

Buat `.env.production`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
JWT_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
COURSE_REPOSITORY_IMPL=prisma
```

Rekomendasi:

- gunakan secret yang panjang dan random,
- jangan commit file env ke Git.

---

## 10. Compose file untuk NestJS app

Contoh `docker-compose.yml`:

```yaml
services:
  app:
    image: ghcr.io/your-org/nestjs-demo:latest
    container_name: nestjs-demo-app
    env_file:
      - .env.production
    restart: unless-stopped
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - app_net

  nginx:
    image: nginx:stable-alpine
    container_name: nestjs-demo-nginx
    depends_on:
      - app
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    networks:
      - app_net

networks:
  app_net:
    driver: bridge
```

Jika kamu belum punya image registry, kamu bisa build image langsung di VPS dari source code. Untuk kelas production, sebaiknya pakai image registry + tag versioned.

---

## 11. Nginx reverse proxy config

Contoh `nginx/default.conf`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ganti `api.your-domain.com` sesuai domain kamu.

---

## 12. Jalankan service di VPS

Di folder `/opt/nestjs-demo`:

```bash
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f app
```

Jika service sehat, lanjut setup HTTPS certificate.

---

## 13. DNS dan HTTPS dengan Let's Encrypt (Certbot)

### 13.1 Cek DNS sebelum issue cert

Tambahkan DNS record:

- `A` record: `api.your-domain.com` -> `IP_VPS`
- (opsional) `AAAA` record untuk IPv6

Cek propagasi:

```bash
dig +short api.your-domain.com
```

Pastikan hasil `dig` mengembalikan IP VPS yang benar.

### 13.2 Pilih metode certbot yang tepat

#### Opsi A: `--standalone` (port 80 harus free)

Jika pakai opsi ini, stop Nginx dulu agar certbot bisa bind ke port 80.

```bash
docker compose stop nginx
sudo certbot certonly --standalone -d api.your-domain.com
docker compose start nginx
```

#### Opsi B: `--webroot` (lebih aman jika Nginx sedang aktif)

Gunakan path challenge yang sudah disediakan pada config Nginx:

```bash
sudo certbot certonly --webroot -w /opt/nestjs-demo/certbot/www -d api.your-domain.com
```

Setelah cert terbit, reload Nginx:

```bash
docker compose exec nginx nginx -s reload
```

Salah satu cara sederhana:

1. Pastikan DNS domain sudah mengarah ke IP VPS.
2. Jalankan certbot (host-level atau containerized certbot) untuk issue certificate.
3. Mount cert ke container Nginx.
4. Reload Nginx setelah cert tersedia.

Contoh command (host-level certbot, Nginx container tetap dipakai):

```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d api.your-domain.com
```

Setelah cert terbit, pastikan path certificate sesuai volume/path yang dibaca Nginx.

---

## 14. Strategi migration di VPS (penting)

Sebelum menjalankan migration, lakukan precheck:

1. Pastikan `.env.production` berisi `DATABASE_URL` production yang benar.
2. Pastikan koneksi DB bisa diakses dari app container.
3. Pastikan tidak ada migration command lain yang berjalan bersamaan.

Jalankan migration sebagai step release terpisah:

```bash
docker compose run --rm app pnpm exec prisma migrate deploy
```

Kenapa tidak di startup app utama?

- Saat scale-out, beberapa instance bisa menjalankan migration bersamaan (race condition).
- Release terpisah lebih aman dan mudah diaudit.

---

## 15. Verifikasi pasca deploy

Lakukan smoke test:

```bash
BASE_URL="https://api.your-domain.com"
curl -i "$BASE_URL/"
curl -i "$BASE_URL/docs"
curl -i "$BASE_URL/courses"
```

Tambahan verifikasi:

- `docker compose ps` menunjukkan service up.
- `docker compose logs --tail=100 app` tidak ada error fatal.
- Nginx access log menunjukkan request masuk.

---

## 16. Rollback runbook (wajib dikuasai)

Skenario: deploy versi baru bermasalah dan perlu balik cepat ke versi stabil.

Langkah rollback:

1. Ganti image ke tag stabil sebelumnya di `docker-compose.yml`  
   Contoh: dari `ghcr.io/your-org/nestjs-demo:v1.1.0` balik ke `v1.0.3`.
2. Jalankan:

```bash
docker compose pull
docker compose up -d
```

3. Verifikasi:

```bash
docker compose ps
curl -i https://api.your-domain.com/
curl -i https://api.your-domain.com/courses
```

4. Catat incident note: penyebab, dampak, waktu recovery.

---

## 17. Operasional minimum setelah go-live

- Gunakan image tag versi (`v1.0.0`, bukan hanya `latest`).
- Simpan backup database terjadwal.
- Monitor CPU, memory, disk, restart count.
- Rotasi log secara berkala.
- Buat runbook incident sederhana untuk tim.

Baseline observability yang direkomendasikan:

- Infrastruktur: CPU > 80% (5 menit), disk free < 20%, memory pressure.
- Aplikasi: lonjakan 5xx, container restart berulang.
- Service health: endpoint `/` atau health endpoint harus konsisten `200`.

---

## 18. Backup dan restore drill

Backup tanpa restore test belum cukup. Jalankan drill berkala:

1. Buat backup snapshot/dump database.
2. Restore ke environment terpisah (staging/sandbox).
3. Jalankan query verifikasi data penting.
4. Dokumentasikan Recovery Time Objective (RTO) aktual.

---

## 19. Troubleshooting matrix VPS

### SSH bisa login, tapi endpoint tidak bisa diakses

- Cek DNS domain.
- Cek UFW (`80`/`443` terbuka).
- Cek service Nginx container hidup.

### Container restart terus

- Cek `docker compose logs app`.
- Validasi env wajib (`DATABASE_URL`, JWT secrets).

### 502 Bad Gateway dari Nginx

- Cek `proxy_pass http://app:3000`.
- Cek app container benar-benar listen di port `3000`.

### HTTPS gagal issue certificate

- Pastikan domain mengarah ke VPS.
- Pastikan port `80` terbuka saat proses challenge.

### Endpoint data error karena table tidak ada

- Jalankan ulang migration release step:
  - `docker compose run --rm app pnpm exec prisma migrate deploy`

---

## 20. Systemd auto-start untuk docker compose stack

Tujuan: memastikan stack otomatis hidup saat VPS reboot.

Contoh unit file `/etc/systemd/system/nestjs-demo.service`:

```ini
[Unit]
Description=NestJS Demo Compose Stack
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/nestjs-demo
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nestjs-demo
sudo systemctl start nestjs-demo
sudo systemctl status nestjs-demo
```

---

## 21. Tugas mandiri

1. Deploy backend ke VPS via Docker Compose.
2. Aktifkan HTTPS pada domain.
3. Jalankan migration production.
4. Lakukan smoke test endpoint utama.
5. Simulasikan rollback ke image tag sebelumnya.

---

## 22. Checklist penilaian

- VPS sudah di-hardening baseline.
- Service app + Nginx berjalan stabil.
- HTTPS aktif dan valid.
- Migration dijalankan dengan strategi release yang aman.
- Endpoint utama lolos verifikasi.

---

## 23. Next Step

Lanjutan yang direkomendasikan:

- Otomasi CI/CD deploy ke VPS (contoh: GitHub Actions + SSH).
- Monitoring dan alerting dasar untuk production.
- Zero-downtime deployment strategy (blue/green atau rolling update).

---

## 24. Referensi

- `docs/step-23-introduction-to-docker-and-deployment.md`
- [Docker Engine Install (Ubuntu)](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Certbot Documentation](https://certbot.eff.org/)
