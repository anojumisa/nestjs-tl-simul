# Step 06 – Middleware di NestJS

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** apa itu middleware dan di mana posisinya di alur request–response.
- **Membedakan** middleware dengan guard, interceptor, dan filter di NestJS.
- **Mampu membuat** middleware sederhana (misalnya logging atau timing).
- **Mampu mendaftarkan** middleware secara global ataupun per-route.

---

## 2. Konsep Dasar Middleware

### 2.1. Middleware secara umum

Secara umum (di dunia Node.js/Express), **middleware** adalah fungsi yang:

- Dieksekusi **sebelum** request mencapai handler utama,
- Mempunyai akses ke:
  - `req` (request),
  - `res` (response),
  - `next()` (fungsi untuk melanjutkan ke middleware/handler berikutnya),
- Bisa:
  - Mengubah/mengisi data di `req` atau `res`,
  - Menghentikan request (misalnya return 403),
  - Atau meneruskan request dengan memanggil `next()`.

Alur sederhananya:

```text
Client → Middleware 1 → Middleware 2 → ... → Controller Handler → Response
```

Jika salah satu middleware **tidak** memanggil `next()` dan malah mengembalikan response, request akan berhenti di situ.

### 2.2. Middleware di NestJS

NestJS dibangun di atas konsep yang mirip dengan Express/Fastify. Di NestJS:

- Middleware bekerja di **level HTTP server** (request mentah),
- Sering dipakai untuk hal-hal seperti:
  - Logging request,
  - Menambahkan header tertentu,
  - Parsingan/normalisasi data di `req`,
  - Pre-check yang tidak butuh pengetahuan tentang “user ter-auth” (itu peran guard),
  - dll.

> Penting: Middleware dieksekusi **sebelum** guard, interceptor, dan filter.

---

## 3. Middleware vs Guard vs Interceptor vs Filter

Ini empat konsep yang sering bikin bingung. Tabel ringkas:

| Konsep      | Kapan jalan                     | Fokus utama                                           |
|------------|----------------------------------|-------------------------------------------------------|
| Middleware | Sebelum masuk ke Nest route     | Operasi HTTP mentah (req/res), logging, pre-processing |
| Guard      | Sebelum handler dijalankan      | Auth & authorization (boleh lanjut atau tidak)       |
| Interceptor| Sebelum & sesudah handler       | Transformasi request/response, logging tingkat tinggi|
| Filter     | Saat exception terjadi          | Menangani error & membentuk response error           |

Contoh pemakaian yang tepat:

- **Middleware**: log semua request ke `/courses`, atau menambah header khusus.
- **Guard**: cek apakah user sudah login dan punya role `instructor`.
- **Interceptor**: bungkus semua response dalam format `{ data: ..., meta: ... }`.
- **Filter**: ubah semua error menjadi format JSON yang konsisten.

Di Step ini kita fokus pada **middleware** dulu.

---

## (Tambahan) Perbandingan: Middleware NestJS vs Middleware/Proxy di Next.js

Konsep middleware di NestJS **mirip secara ide**, tapi berbeda konteks dengan middleware (atau yang sering dianggap “proxy layer”) di Next.js.

### Persamaan

Keduanya sama-sama:

- Berjalan **sebelum** handler utama (controller/route handler/page).
- Bisa digunakan untuk:
  - Logging,
  - Mengecek request (pre-check),
  - Menambah informasi pada request,
  - Menghentikan request lebih awal (misalnya redirect/forbidden),
  - Mengatur header.

Intinya: **lapisan pre-processing** sebelum request diproses lebih lanjut.

### Perbedaan Utama

#### 1) Lokasi dan scope aplikasi

- **NestJS middleware**
  - Berjalan di **backend service NestJS** (API server).
  - Scope-nya: semua request yang masuk ke server Nest (atau subset route yang kamu pilih).
  - Cocok untuk kebutuhan backend, misalnya logging request API, menambahkan requestId, atau pre-processing sebelum guard/interceptor.

- **Next.js middleware**
  - Berjalan di **aplikasi Next.js** (yang bisa mencakup page rendering dan API routes).
  - Sering berjalan di layer **edge/server** yang dekat dengan user.
  - Cocok untuk kebutuhan web app/gateway seperti redirect auth, rewrite URL, atau “proxy rules” sebelum request menuju route.

#### 2) Bentuk API pemrograman

- **NestJS** (gaya Express/Fastify):

  ```typescript
  (req, res, next) => { /* ... */; next(); }
  ```

  Middleware biasanya memanggil `next()` untuk melanjutkan pipeline.

- **Next.js** (berbasis Web API Request/Response):

  ```typescript
  export function middleware(req: NextRequest) {
    return NextResponse.next(); // atau redirect/rewrite
  }
  ```

  Tidak ada `next()` callback seperti Express; kontrol alur dilakukan dengan `return` response.

#### 3) Tujuan paling umum

- **NestJS middleware**:
  - Fokus ke pipeline backend (request mentah → controller).
  - Di Nest, setelah middleware masih ada layer lain seperti:
    - Pipes, Guards, Interceptors, Filters.

- **Next.js middleware**:
  - Fokus sebagai “gerbang” di web app:
    - redirect ke login,
    - rewrite route,
    - menambah header untuk caching/experiments,
    - dan routing/proxy behavior di edge.

### Kesimpulan singkat

- **Ide dasarnya sama**: fungsi yang berjalan sebelum handler.
- **Bedanya** ada pada konteks:
  - NestJS = middleware untuk backend service.
  - Next.js = middleware untuk web app/edge routing dan kadang dipakai sebagai proxy layer.

---

## 4. Jenis Middleware di NestJS

NestJS mendukung dua gaya:

1. **Functional middleware** – fungsi biasa `(req, res, next) => { ... }`.
2. **Class-based middleware** – class yang mengimplementasikan interface `NestMiddleware`.

Keduanya pada dasarnya melakukan hal yang sama, hanya beda gaya penulisan.

---

## 5. Contoh: Logging Middleware Sederhana

### 5.1. Functional middleware

Contoh logging request:

```typescript
// src/common/middleware/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl } = req;
  const start = Date.now();

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const duration = Date.now() - start;
    console.log(`[${method}] ${originalUrl} → ${statusCode} (${duration}ms)`);
  });

  next();
}
```

Penjelasan:

- Middleware ini:
  - Menyimpan waktu mulai (`start`),
  - Setelah response selesai (`res.on('finish')`), log:
    - method (GET/POST),
    - URL,
    - status code,
    - waktu eksekusi.
- `next()` **wajib** dipanggil agar request lanjut ke handler berikutnya.

### 5.2. Class-based middleware

Versi class:

```typescript
// src/common/middleware/logger-class.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerClassMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const duration = Date.now() - start;
      console.log(`[${method}] ${originalUrl} → ${statusCode} (${duration}ms)`);
    });

    next();
  }
}
```

Bedanya hanya di bentuk (class + `use()`), cara pakainya di module sedikit berbeda.

### 5.3. Contoh: Tracking Request (Request ID)

Tujuan tracking adalah membuat **ID unik** untuk setiap request, supaya log dan debugging lebih mudah. Misalnya:

- Saat ada error di production, kamu bisa cari semua log yang punya `requestId` yang sama.
- Frontend bisa mengirimkan `X-Request-Id` saat lapor bug, lalu backend bisa menelusuri request tersebut.

Contoh middleware yang:

- Mengambil `X-Request-Id` dari client jika ada,
- Jika tidak ada, membuat `requestId` baru,
- Menambahkan `X-Request-Id` ke response header,
- Menyimpan `requestId` di `req` untuk dipakai di log lain.

```typescript
// src/common/middleware/request-id.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

type RequestWithId = Request & { requestId?: string };

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const incoming = req.header('x-request-id');
  const requestId = incoming ?? randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
```

> Catatan: `randomUUID()` tersedia di Node versi modern. Kalau environment kamu belum mendukung, alternatifnya bisa pakai `Date.now()` + random string.

### 5.4. Contoh: Rate Limiting Middleware (Demo)

**Rate limiting** membatasi jumlah request dalam periode waktu tertentu untuk mencegah abuse (misalnya spam). Untuk production, biasanya pakai solusi yang lebih matang (Redis-based, gateway, atau library khusus). Tetapi untuk belajar, middleware demo ini cukup.

Contoh sederhana:

- Batas: **10 request per menit** per IP untuk endpoint tertentu.
- Jika melewati batas: response **429 Too Many Requests**.

```typescript
// src/common/middleware/rate-limit.middleware.ts
import { Request, Response, NextFunction } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number; // epoch ms
};

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 menit
const LIMIT = 10;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const key = `${ip}:${req.method}:${req.path}`;

  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  current.count += 1;
  store.set(key, current);

  const remaining = Math.max(0, LIMIT - current.count);
  res.setHeader('X-RateLimit-Limit', String(LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(current.resetAt));

  if (current.count > LIMIT) {
    return res.status(429).json({
      message: 'Too Many Requests',
      limit: LIMIT,
      windowMs: WINDOW_MS,
      resetAt: current.resetAt,
    });
  }

  return next();
}
```

Keterbatasan demo ini:

- Data disimpan di memory proses Node (restart server → reset).
- Tidak cocok untuk multi-instance/cluster.
- Tidak mempertimbangkan userId/token (hanya IP + method + path).

---

## 6. Mendaftarkan Middleware

Ada beberapa level pendaftaran:

### 6.1. Per-module / per-route (disarankan untuk belajar)

Contoh: hanya untuk route di `CoursesModule`.

Di `courses.module.ts`:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { logger } from '../common/middleware/logger.middleware';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(logger) // bisa juga LoggerClassMiddleware
      .forRoutes(CoursesController); // atau { path: 'courses', method: RequestMethod.ALL }
  }
}
```

Penjelasan:

- `apply(logger)` – memilih middleware mana yang dipakai.
- `.forRoutes(CoursesController)` – middleware hanya jalan untuk semua route di controller ini.
  - Kamu bisa ganti dengan:
    - `.forRoutes('courses')` → semua route yang path-nya mulai dengan `/courses`.
    - `.forRoutes({ path: 'courses', method: RequestMethod.GET })` → hanya GET /courses.

### 6.2. Global middleware

Jika digunakan di `main.ts`:

```typescript
const app = await NestFactory.create(AppModule);
app.use(logger); // semua request ke semua route lewat sini
```

Ini akan menambahkan middleware ke **seluruh** aplikasi.

---

## 6A. Cara Mengecek Middleware Sudah Terpasang (Static & Runtime)

Bagian ini membantu kamu membuktikan bahwa middleware benar-benar jalan, bukan hanya “sudah ditulis”.

### 6A.1. Static check (cek dari kode)

Middleware dianggap terpasang jika kamu menemukan salah satu pola ini:

- **Per-module/per-route**: ada `configure(consumer)` dan `consumer.apply(...).forRoutes(...)`.
- **Global**: ada `app.use(...)` di `main.ts`.

Contoh per-module:

```typescript
consumer
  .apply(requestIdMiddleware, loggerMiddleware, rateLimitMiddleware)
  .forRoutes({ path: 'courses', method: RequestMethod.ALL });
```

### 6A.2. Runtime check (cek dari perilaku aplikasi)

#### A) Cek `requestIdMiddleware`

- Hit endpoint `GET /courses`
- Pastikan response punya header **`X-Request-Id`**

Cara cepat:

```bash
curl -i http://localhost:3000/courses
```

#### B) Cek `loggerMiddleware`

- Hit endpoint `GET /courses` atau `POST /courses`
- Lihat terminal server Nest berjalan
- Harus muncul log method/path/status/duration, misalnya:

```text
[requestId=...] [GET] /courses → 200 (Xms)
```

#### C) Cek `rateLimitMiddleware` (demo)

- Panggil endpoint yang sama berkali-kali dalam 1 menit
- Jika melewati limit, harus dapat **429 Too Many Requests**

Cara cepat (bash):

```bash
for i in {1..40}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/courses; done
```

Catatan penting:

- Command di atas **hanya mencetak HTTP status code** (karena memakai `-w "%{http_code}\n"`), jadi **header tidak akan terlihat**.
- Untuk melihat header rate limit, gunakan salah satu cara ini:

Header + status + body:

```bash
curl -i http://localhost:3000/courses
```

Header saja (tanpa body):

```bash
curl -s -D - -o /dev/null http://localhost:3000/courses
```

Filter header rate limit saja:

```bash
curl -s -D - -o /dev/null http://localhost:3000/courses | grep -i ratelimit
```

Jika rate limit aktif, kamu biasanya melihat header:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## 7. Contoh Use Case Middleware

Beberapa contoh umum:

- **Logging** – seperti contoh di atas.
- **Menambah header** – misalnya header CORS tertentu (walau biasanya pakai `app.enableCors` atau library khusus).
- **Rate limit sederhana** – menghitung request dari IP tertentu (untuk demo; untuk production lebih baik pakai solusi matang).
- **Menyalin informasi ke `req`** – misalnya `req.requestId = ...` lalu dipakai oleh service/interceptor.

Hal-hal yang **biasanya bukan** tugas middleware:

- Cek user punya role tertentu → lebih cocok di **Guard**.
- Transformasi response (membungkus JSON) → lebih cocok di **Interceptor**.
- Menangani error/exception → lebih cocok di **Exception Filter**.

---

## 8. Tugas Mandiri (Wajib)

1. **Buat Logging Middleware**
   - Buat file middleware (functional atau class-based) yang:
     - Mencetak method, URL, status code, dan waktu eksekusi.
   - Daftarkan middleware ini hanya untuk route `CoursesController`.

2. **Uji dengan Postman/Swagger**
   - Panggil:
     - `GET /courses`
     - `GET /courses/:id`
     - `POST /courses`
   - Lihat log di terminal; pastikan setiap request tercatat dengan benar.

3. **Buat Middleware Sederhana Lain**
   - Contoh:
     - Middleware yang menambah header `X-Request-From: NestJS-Learning` pada semua response `/courses`.
   - Verifikasi dengan melihat response header di Postman/Thunder Client.

4. **Catatan `notes-step-06-middleware.md`**
   - Jelaskan:
     - Menurutmu, apa perbedaan utama middleware dengan guard?
     - Kapan sebaiknya logika diletakkan di middleware vs di service?

---

## 9. Checklist Penilaian

Kamu dianggap **lulus Step 06** jika:

- [ ] Ada minimal satu middleware yang berjalan dan terlihat efeknya (logging atau header).
- [ ] Middleware hanya aktif untuk route yang dimaksud (misalnya hanya untuk Course jika itu tujuan).
- [ ] Kamu dapat menjelaskan perbedaan tugas Middleware vs Guard vs Interceptor vs Filter.
- [ ] `notes-step-06-middleware.md` berisi refleksi singkatmu.

---

## 10. Tantangan Tambahan (Opsional)

- **Tantangan 1 – Conditional Logging**  
  Hanya log request yang memakan waktu lebih dari 500ms. (Misalnya, untuk mengidentifikasi endpoint yang lambat.)

- **Tantangan 2 – Simple Rate Limiter (Demo)**  
  Buat middleware yang:
  - Menghitung berapa kali IP tertentu memanggil `/courses` dalam 1 menit (bisa pakai in-memory map),
  - Jika lebih dari angka tertentu, kembalikan 429 (Too Many Requests).

- **Tantangan 3 – Request ID**  
  Tambahkan middleware yang:
  - Menghasilkan `requestId` (misalnya UUID atau timestamp+random) untuk setiap request,
  - Menaruhnya di header response (`X-Request-Id`),
  - Dan di `req` sehingga service/interceptor bisa membacanya untuk log lanjutan.

