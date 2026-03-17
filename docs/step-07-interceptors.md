# Step 07 – Interceptors di NestJS

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** apa itu interceptor dan posisinya di alur request–response NestJS.
- **Membedakan** interceptor vs middleware vs pipe vs guard vs exception filter.
- **Mampu membuat** interceptor untuk:
  - logging + timing (berapa lama request diproses),
  - membungkus response (response shape konsisten),
  - menambahkan metadata (mis. `requestId`) ke response.
- **Mampu mendaftarkan** interceptor secara global, per-controller, atau per-route.

---

## 2. Interceptor itu apa?

**Interceptor** adalah komponen di NestJS yang bisa “membungkus” eksekusi handler.

Interceptor bisa jalan:

- **Sebelum** handler (pre-processing),
- **Sesudah** handler selesai (post-processing),
- Bahkan bisa memodifikasi **response** yang keluar dari handler.

Cara memikirkan interceptor:

> “Kalau middleware bekerja di level request mentah (req/res), interceptor bekerja di level NestJS (handler + return value).”

---

## 3. Posisi Interceptor di Pipeline NestJS

Gambaran sederhana pipeline (tidak 100% detail internal, tapi cukup untuk mental model):

```text
Client
  ↓
Middleware (Express/Fastify layer)
  ↓
Guards (izin akses)
  ↓
Interceptors (wrap handler & response)
  ↓
Pipes (transform/validate param/body/query untuk handler)
  ↓
Controller Handler → Service → Repository → ...
  ↓
Interceptors (post-processing response)
  ↓
Exception Filter (jika terjadi error/exception)
  ↓
Response
```

Catatan penting:

- Interceptor sangat kuat untuk:
  - standardisasi response,
  - logging yang rapi,
  - menambahkan metadata,
  - caching (advanced).
- Untuk error handling yang konsisten, biasanya lebih cocok memakai **Exception Filter** (Step berikutnya).

---

## 4. Interceptor vs Middleware vs Pipe vs Guard vs Filter

| Konsep | Kapan jalan | Fokus utama | Contoh paling umum |
|--------|-------------|-------------|--------------------|
| Middleware | Sebelum masuk Nest routing | HTTP mentah (req/res), header, pre-processing | requestId, logging global, rate limit |
| Guard | Sebelum handler | **Boleh lanjut atau tidak** (auth/role) | JWT auth, role check |
| Pipe | Saat binding parameter | Transform & validasi input | ValidationPipe, ParseIntPipe |
| Interceptor | Sebelum & sesudah handler | Wrap handler & response | logging/timing, response wrapper |
| Filter | Saat exception terjadi | Bentuk & standar error response | format error konsisten |

---

## 5. Kenapa Interceptor itu penting?

Tanpa interceptor, beberapa kebutuhan ini sering membuat code “menyebar”:

- Kamu ingin response selalu punya bentuk `{ data, meta }` → kalau tidak pakai interceptor, kamu harus bungkus manual di setiap handler.
- Kamu ingin log durasi request per endpoint → kalau tidak pakai interceptor, kamu akan mengulang di banyak tempat.
- Kamu ingin menambahkan `requestId` di setiap response → tanpa interceptor, kamu harus set header/field manual.

Dengan interceptor, kamu bisa menaruh logic lintas endpoint di **satu tempat**.

---

## 6. Contoh Interceptor 1: Logging + Timing (berapa ms)

Interceptor ini akan:

- Mencetak method + path (kalau bisa diambil) dan durasi eksekusi,
- Menunjukkan kapan request mulai dan selesai.

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();

    const method = (req as any).method;
    const url = (req as any).originalUrl ?? (req as any).url;
    const requestId = (req as any).requestId;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const prefix = requestId ? `[requestId=${requestId}] ` : '';
        console.log(`${prefix}[${method}] ${url} (${duration}ms)`);
      }),
    );
  }
}
```

**Penjelasan singkat:**

- `intercept()` dipanggil untuk setiap request yang melewati interceptor ini.
- `next.handle()` menjalankan handler berikutnya (controller handler).
- `tap()` dieksekusi setelah handler berhasil mengembalikan response (tanpa mengubah response).

> Catatan: contoh ini memanfaatkan `requestId` jika kamu sudah membuat middleware requestId di Step 06.

---

## 7. Contoh Interceptor 2: Response Wrapper (standarisasi bentuk response)

Misalnya kamu ingin semua response sukses selalu berbentuk:

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-17T00:00:00.000Z"
  }
}
```

Interceptor wrapper ini akan:

- Menerima return value dari handler (apapun itu),
- Membungkusnya ke `{ data, meta }`.

```typescript
// src/common/interceptors/wrap-response.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
```

**Penjelasan singkat:**

- `map()` mengubah output handler.
- Controller/service tidak perlu tahu soal wrapper ini.

Catatan praktik:

- Wrapper seperti ini bagus untuk konsistensi, tapi pastikan frontend setuju dengan formatnya.
- Untuk error response, biasanya diatur lewat **exception filter** (bukan interceptor).

---

## 8. Contoh Interceptor 3: Menyisipkan `requestId` ke response

Jika kamu sudah punya middleware requestId yang menaruh `req.requestId` dan header `X-Request-Id`, kamu bisa juga menambahkan requestId ke body response (opsional).

```typescript
// src/common/interceptors/request-id-response.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RequestIdResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();
    const requestId = (req as any).requestId;

    return next.handle().pipe(
      map((data) => {
        if (!requestId) return data;
        return {
          requestId,
          data,
        };
      }),
    );
  }
}
```

**Catatan:**

- Jangan lakukan ini jika kamu sudah memakai response wrapper `{ data, meta }` — kalau iya, lebih baik requestId dimasukkan ke `meta`.
- Usahakan satu standar response yang konsisten.

---

## 9. Cara Mendaftarkan Interceptor

Ada 3 cara umum:

### 9.1. Per-route / per-controller (paling mudah untuk belajar)

Di controller atau handler, pakai `@UseInterceptors()`:

```typescript
import { UseInterceptors } from '@nestjs/common';

@UseInterceptors(LoggingInterceptor)
@Controller('courses')
export class CoursesController {}
```

Atau hanya untuk satu handler:

```typescript
@Get()
@UseInterceptors(WrapResponseInterceptor)
findAll() {
  return this.coursesService.findAll();
}
```

### 9.2. Global interceptor (berlaku untuk seluruh aplikasi)

Konsepnya biasanya di `main.ts`:

```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

Atau lewat provider Nest dengan token `APP_INTERCEPTOR` (lebih idiomatis Nest), misalnya di `AppModule`.

> Untuk mentoring, cukup jelaskan konsep global. Implementasi persisnya bisa kamu pilih sesuai style project.

---

## 10. Cara Testing Interceptor

Kamu bisa menguji interceptor dengan:

### 10.1. Postman / Swagger

- Jalankan server (`start:dev`).
- Panggil endpoint seperti:
  - `GET /courses`
  - `POST /courses`
- Lihat efeknya:
  - Jika interceptor logging: lihat log di terminal.
  - Jika wrapper: perhatikan bentuk response jadi `{ data, meta }`.
  - Jika requestId: lihat header `X-Request-Id` dan/atau field `requestId` di response body.

### 10.2. Tes manual “format response konsisten”

Bandingkan output sebelum & sesudah wrapper interceptor:

- Tanpa wrapper: response course = object/array “mentah”
- Dengan wrapper: response selalu memiliki property `data` dan `meta`

---

## 11. Tugas Mandiri (Wajib)

1. **Buat `LoggingInterceptor`**
   - Log: method, path, dan durasi request (ms).
   - Jika ada `requestId` dari middleware Step 06, tampilkan di log.

2. **Buat `WrapResponseInterceptor`**
   - Bungkus response sukses dalam format `{ data, meta: { timestamp } }`.
   - Terapkan minimal ke semua endpoint di `CoursesController` (boleh per-controller).

3. **Uji dengan Postman/Swagger**
   - Pastikan response sudah ter-wrap.
   - Pastikan log muncul untuk setiap request.

4. **Catatan `notes-step-07-interceptors.md`**
   - Jelaskan:
     - Perbedaan middleware vs interceptor menurutmu.
     - Kenapa response wrapper lebih cocok di interceptor daripada di controller.

---

## 12. Checklist Penilaian

Kamu dianggap **lulus Step 07** jika:

- [ ] Ada interceptor logging yang berjalan dan mencetak durasi request.
- [ ] Response wrapper aktif dan semua endpoint yang ditentukan mengembalikan format konsisten.
- [ ] Kamu dapat menjelaskan perbedaan tugas interceptor vs middleware/pipes/guards/filters.
- [ ] `notes-step-07-interceptors.md` berisi refleksi singkatmu.

---

## 13. Tantangan Tambahan (Opsional)

- **Tantangan 1 – Meta yang lebih informatif**
  - Tambahkan `meta.path`, `meta.method`, dan `meta.requestId` (jika ada) ke wrapper response.

- **Tantangan 2 – Eksklusikan endpoint tertentu**
  - Buat agar wrapper tidak berlaku untuk endpoint tertentu (misalnya health check) dengan decorator custom atau conditional logic.

- **Tantangan 3 – Caching (Konsep)**
  - Pelajari konsep interceptor untuk caching (misalnya cache response `GET /courses` untuk beberapa detik) dan tuliskan idenya di notes tanpa perlu implementasi.

