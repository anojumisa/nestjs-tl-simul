# Step 01 – Setup Project & Kenalan dengan NestJS

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** secara garis besar apa itu NestJS dan kenapa dipakai.
- **Menyiapkan** environment dasar (Node.js, Nest CLI).
- **Membuat** project NestJS baru dan menjalankannya.
- **Mengenali** struktur folder utama di proyek NestJS.

---

## 2. Konteks Proyek: Learning Platform API

Di mentoring ini kita akan membangun sebuah **Learning Platform API** (backend saja) dengan NestJS.

Contoh fitur yang akan ada:

- User bisa **registrasi** dan **login**.
- **Instruktur** bisa membuat dan mengelola **Course** dan **Lesson**.
- **Student** bisa **enroll** ke Course dan melihat daftar Course yang diikuti.

Pada step ini kita **belum** mengimplementasikan fitur-fitur itu. Fokus kita dulu adalah:

- Environment siap.
- Proyek NestJS jalan.
- Mengerti struktur dasarnya.

---

## 3. Konsep Singkat: Apa itu NestJS?

**NestJS** adalah framework backend berbasis **Node.js** dan **TypeScript**, dengan konsep:

- **Opinionated**: memberi struktur dan best practice sejak awal.
- **Modular**: kode dipecah ke dalam **module**.
- **Terinspirasi arsitektur enterprise**: mirip pola di Angular untuk backend.
- **Enterprise-ready**: cocok untuk project besar dan tim.

Kita akan banyak pakai:

- **Module** – untuk mengelompokkan fitur (misal: `CoursesModule`).
- **Controller** – untuk menangani request HTTP (route).
- **Service** – untuk business logic utama.
- **Dependency Injection** – cara Nest “menyuntikkan” dependency ke class lain.

Detail-nya akan kamu temui di step-step berikutnya.

---

## 4. Prasyarat Teknis

Sebelum mulai, pastikan:

- **Node.js** versi terbaru LTS sudah ter-install.
- **npm** atau **yarn** sudah siap dipakai.
- Editor (disarankan **VSCode** atau **Cursor**).

Cara cek Node dan npm:

```bash
node -v
npm -v
```

---

## 5. Langkah Praktis – Setup Proyek NestJS

### 5.1. Install Nest CLI

Nest CLI membantu generate struktur kode dengan rapi.

```bash
npm install -g @nestjs/cli
```

Cek apakah sudah ter-install:

```bash
nest --version
```

### 5.2. Generate Project Baru

Pilih nama folder project sesuai arahan mentor, misal: `learning-platform-api`.

```bash
nest new learning-platform-api
```

Saat diminta memilih package manager, boleh gunakan `npm` atau `yarn` (sesuaikan preferensi / standar kelas).

Masuk ke folder project:

```bash
cd learning-platform-api
```

### 5.3. Menjalankan Aplikasi

Jalankan server development:

```bash
npm run start:dev
# atau
yarn start:dev
```

Buka browser dan akses:

```text
http://localhost:3000
```

Kamu harus melihat response default dari NestJS, biasanya string `Hello World!`.

---

## 6. Contoh Kode Dasar (Step 01)

Bagian ini berisi contoh implementasi kode dasar yang bisa kamu jadikan referensi. Kamu tetap dianjurkan untuk mencoba menulisnya sendiri terlebih dahulu.

### 6.1. `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
  console.log('Learning Platform API – NestJS running on http://localhost:3000');
}
bootstrap();
```

### 6.2. `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 6.3. `src/app.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRootMessage(): string {
    return this.appService.getRootMessage();
  }
}
```

### 6.4. `src/app.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRootMessage(): string {
    return 'Learning Platform API – NestJS';
  }
}
```

---

## 7. Tugas Mandiri (Wajib)

Kerjakan tugas berikut setelah sesi:

1. **Ubah pesan default**
   - Ganti text `Hello World!` menjadi sesuatu seperti:
     `"Learning Platform API – NestJS"`.
   - Tes dengan mengakses kembali `http://localhost:3000`.

2. **Beri komentar singkat (dalam Bahasa Indonesia) di file `main.ts`**
   Jelaskan dengan 1–2 kalimat:
   - Menurut kamu, `bootstrap()` itu apa fungsinya?
   - `NestFactory.create(AppModule)` itu membuat apa?

3. **Tuliskan catatan pendek (`notes-step-01.md`)**
   Di dalam projectmu, buat file catatan (boleh di folder `notes` atau `docs` sendiri) yang berisi:
   - Versi Node.js dan npm yang kamu pakai.
   - Perintah apa saja yang kamu jalankan.
   - 2–3 hal baru yang kamu pelajari tentang NestJS dari step ini.

*(Lokasi dan format file bisa mengikuti instruksi mentor di kelas.)*

---

## 8. Checklist Penilaian

Kamu dianggap **lulus Step 01** jika:

- [ ] Bisa menjalankan NestJS dan mengakses `http://localhost:3000`.
- [ ] Pesan default sudah diganti sesuai instruksi.
- [ ] Mengerti secara garis besar fungsi `main.ts` dan `app.module.ts` (dibuktikan lewat komentar/notes).
- [ ] Mengumpulkan catatan `notes-step-01.md` (atau sesuai format yang diminta).

---

## 9. Tantangan Tambahan (Opsional)

Untuk yang mau eksplor lebih:

- **Tantangan 1**  
  Jalankan project dengan port yang berbeda (misalnya `4000`) dengan mengubah konfigurasi di `main.ts`.

- **Tantangan 2**  
  Cari tahu apa itu **Hot Reload** di NestJS dan jelaskan singkat di catatanmu.

