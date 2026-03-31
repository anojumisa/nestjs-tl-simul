# Appendix – DB Tools Quickstart (DBeaver & pgAdmin)

Panduan ini sengaja dibuat **ringkas dan praktis** untuk sesi kelas/lab.  
Gunakan bersamaan dengan:

- `docs/step-11-database-dbrms-fundamental.md`
- `docs/step-12-sql-fundamental.md`

---

## 1. Checklist sebelum mulai

- [ ] DB server sudah jalan (lokal/container/cloud).
- [ ] Punya parameter koneksi: `host`, `port`, `database`, `username`, `password`.
- [ ] Tahu database target yang akan dipakai untuk praktikum.
- [ ] Sudah siapkan file script:
  - `01_schema.sql`
  - `02_seed.sql`
  - `03_queries.sql`

---

## 2. DBeaver quickstart

### 2.1. Buat koneksi PostgreSQL

1. Buka DBeaver.
2. Klik **New Database Connection**.
3. Pilih **PostgreSQL**.
4. Isi:
   - Host: `localhost` (atau host server kamu)
   - Port: `5432`
   - Database: contoh `learning_platform`
   - User: contoh `postgres`
   - Password: sesuai environment
5. Klik **Test Connection**.
6. Jika sukses, klik **Finish**.

### 2.2. Jalankan SQL script

1. Klik kanan database -> **SQL Editor** -> **New SQL Script**.
2. Paste `01_schema.sql`, lalu execute.
3. Paste `02_seed.sql`, lalu execute.
4. Jalankan query di `03_queries.sql`.

Shortcut umum:

- Execute statement: `Cmd + Enter` (macOS) / `Ctrl + Enter` (Windows/Linux)

### 2.3. Validasi hasil

- Buka panel table -> cek row pada `courses`, `lessons`, `students`, `enrollments`.
- Jalankan `SELECT COUNT(*) ...` untuk memastikan seed masuk.

### 2.4. Screenshot checklist (untuk laporan student)

- [ ] Screenshot halaman koneksi berhasil
- [ ] Screenshot SQL Editor saat run schema
- [ ] Screenshot hasil query JOIN
- [ ] Screenshot hasil aggregate (`GROUP BY`)

---

## 3. pgAdmin quickstart

### 3.1. Register server

1. Buka pgAdmin.
2. Klik kanan **Servers** -> **Register** -> **Server...**
3. Tab **General**: isi nama server (mis. `Local PostgreSQL`).
4. Tab **Connection**:
   - Host name/address
   - Port `5432`
   - Maintenance database (mis. `postgres`)
   - Username
   - Password
5. Simpan.

### 3.2. Buat / pilih database praktikum

1. Expand server -> **Databases**.
2. Jika belum ada, create database baru (mis. `learning_platform`).
3. Klik database target.

### 3.3. Jalankan Query Tool

1. Klik database -> **Tools** -> **Query Tool**.
2. Jalankan `01_schema.sql`.
3. Jalankan `02_seed.sql`.
4. Jalankan query di `03_queries.sql`.

### 3.4. Screenshot checklist (untuk laporan student)

- [ ] Screenshot server connected
- [ ] Screenshot Query Tool saat run `CREATE TABLE`
- [ ] Screenshot hasil `SELECT ... JOIN ...`
- [ ] Screenshot hasil transaction test (`BEGIN/ROLLBACK`)

---

## 4. Troubleshooting cepat

### 4.1. Connection refused / timeout

- Cek DB server sudah running.
- Cek host/port benar.
- Jika pakai Docker, cek mapping port container.

### 4.2. Authentication failed

- Cek username/password.
- Cek user punya permission ke database target.

### 4.3. Relation/table does not exist

- Pastikan `01_schema.sql` sudah dieksekusi di database yang benar.
- Pastikan kamu tidak salah koneksi ke DB lain.

### 4.4. Duplicate key / unique violation

- Artinya data seed sudah pernah diinsert.
- Solusi aman untuk latihan: kosongkan table atau pakai data unik baru.

---

## 5. Best practice untuk kelas

- Pisahkan script schema, seed, dan query.
- Mulai dari query kecil, lalu naik ke JOIN dan aggregate.
- Biasakan tulis `WHERE` di `UPDATE/DELETE` untuk hindari salah mass update.
- Selalu verifikasi DB aktif sebelum execute query.
- Jangan simpan password DB di repo.

---

## 6. Output minimal yang dikumpulkan student

1. File SQL:
   - `01_schema.sql`
   - `02_seed.sql`
   - `03_queries.sql`
2. 3–4 screenshot (koneksi, JOIN, aggregate, transaction).
3. Ringkasan singkat:
   - tool yang dipakai (DBeaver/pgAdmin),
   - kendala utama,
   - cara menyelesaikannya.

