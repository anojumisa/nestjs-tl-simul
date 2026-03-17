# Step 08 – Exception Filters di NestJS

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** apa itu exception filter dan kapan dipakai.
- **Membedakan** exception filter vs interceptor (response sukses) vs middleware (HTTP mentah).
- **Mampu membuat** global exception filter untuk:
  - menyatukan format error response,
  - menambahkan metadata seperti `timestamp`, `path`, dan `requestId`.
- **Mampu menguji** error handling lewat Postman/Swagger.

---

## 2. Exception Filter itu apa?

Di NestJS, error biasanya muncul dalam dua bentuk:

1. **`HttpException`** (dan turunannya seperti `BadRequestException`, `NotFoundException`, `UnauthorizedException`)  
   Ini error yang “disengaja” untuk memberi tahu client bahwa request-nya bermasalah.

2. **Error tak terduga** (misalnya `TypeError`, error dari library, bug)  
   Ini biasanya harus menjadi `500 Internal Server Error` dan tetap perlu respons yang rapi.

**Exception Filter** adalah mekanisme NestJS untuk menangkap exception tersebut dan:

- menentukan **status code**,
- membentuk **body response error**,
- dan (opsional) menambahkan logging atau metadata.

---

## 3. Kenapa kita butuh Exception Filter?

Tanpa exception filter:

- Format error bisa berbeda-beda (tergantung dari mana error-nya muncul).
- Frontend harus menangani banyak bentuk error response.
- Sulit melakukan debugging karena informasi error tidak konsisten (misalnya tidak ada path/timestamp/requestId).

Dengan exception filter:

- Semua error punya format yang konsisten, misalnya:

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Course with id 999 not found",
    "details": null
  },
  "meta": {
    "timestamp": "2026-03-17T00:00:00.000Z",
    "path": "/courses/999",
    "requestId": "..."
  }
}
```

Ini sangat membantu frontend dan memudahkan proses debugging.

---

## 4. Filter vs Interceptor: Bedanya apa?

- **Interceptor** cocok untuk:
  - membungkus response sukses (`{ data, meta }`),
  - logging/timing,
  - transform output handler.

- **Exception Filter** cocok untuk:
  - membungkus response error dengan format konsisten,
  - mapping error tak terduga menjadi `500`,
  - mengontrol payload error yang aman untuk client.

Praktik yang bagus:

- Response sukses distandarkan oleh **interceptor** (Step 07).
- Response error distandarkan oleh **exception filter** (Step 08).

---

## 5. Membuat Global HTTP Exception Filter (Template)

Di bawah ini contoh filter yang menangkap semua exception (baik `HttpException` maupun error umum).

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const timestamp = new Date().toISOString();
    const path = request?.originalUrl ?? request?.url;
    const requestId = request?.requestId; // jika kamu pakai requestId middleware

    // Default untuk error tak terduga
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      /**
       * `getResponse()` bisa berupa:
       * - string
       * - object { message, error, statusCode }
       * - array message (terutama dari ValidationPipe)
       */
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        message = anyRes.message ?? exception.message ?? 'Request error';

        // details optional: bisa simpan seluruh payload agar frontend bisa tampilkan error lebih lengkap
        // tapi hati-hati untuk tidak membocorkan informasi sensitif.
        details = anyRes;
      } else {
        message = exception.message ?? 'Request error';
      }
    } else if (exception instanceof Error) {
      // Error umum: jangan bocorkan stack ke client (untuk production)
      message = exception.message || 'Internal server error';
    }

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        details,
      },
      meta: {
        timestamp,
        path,
        requestId,
      },
    });
  }
}
```

**Penjelasan singkat:**

- `@Catch()` tanpa parameter berarti menangkap **semua** exception.
- Untuk `HttpException`, kita pakai `getStatus()` dan `getResponse()` agar pesan validasi (`ValidationPipe`) juga bisa diambil.
- Untuk error umum, kita mapping ke `500`.
- `requestId` akan ada jika kamu sudah menerapkan middleware requestId (Step 06).

> Catatan keamanan: untuk production, hindari mengembalikan `details` yang berisi informasi sensitif (misalnya stack trace). Untuk mentoring, ini membantu debugging.

---

## 6. Cara Mendaftarkan Filter

Ada beberapa cara:

### 6.1. Global di `main.ts` (konsep)

```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

Ini akan membuat semua exception di seluruh aplikasi lewat filter yang sama.

### 6.2. Per-controller / per-route

```typescript
@UseFilters(HttpExceptionFilter)
@Controller('courses')
export class CoursesController {}
```

Biasanya untuk standarisasi error, kamu lebih suka global.

---

## 7. Cara Testing Exception Filter

Uji dengan Postman/Swagger:

### 7.1. Trigger `ParseIntPipe` error (400)

- Request: `GET /courses/abc`
- Harusnya error 400 dengan body yang sudah distandarkan oleh filter.

### 7.2. Trigger `NotFoundException` (404)

- Pastikan service kamu melempar `NotFoundException` saat data tidak ada.
- Request: `GET /courses/99999`
- Harusnya error 404 dengan format yang konsisten.

### 7.3. Trigger `ValidationPipe` error (400)

- Request: `POST /courses` dengan body invalid (misalnya `title` kosong).
- Harusnya error 400.

Perhatikan khususnya:

- Field `meta.path` benar,
- `meta.timestamp` ada,
- `meta.requestId` muncul jika middleware requestId aktif.

---

## 8. Tugas Mandiri (Wajib)

1. **Buat HttpExceptionFilter**
   - Tangkap `HttpException` dan error umum.
   - Bentuk response error konsisten (bebas format, tapi harus seragam).

2. **Pasang filter secara global**
   - Pastikan semua endpoint mengembalikan format error yang sama.

3. **Uji minimal 3 skenario**
   - `ParseIntPipe` error (`/courses/abc`),
   - `NotFoundException` (`/courses/99999`),
   - `ValidationPipe` error (POST body invalid).

4. **Catatan `notes-step-08-exception-filters.md`**
   - Jelaskan:
     - Kenapa error response perlu distandarkan?
     - Apa bedanya response sukses (interceptor) dan response error (filter)?
     - Informasi apa yang aman vs tidak aman untuk dikirim ke client?

---

## 9. Checklist Penilaian

Kamu dianggap **lulus Step 08** jika:

- [ ] Exception filter aktif dan menangkap error dari berbagai sumber.
- [ ] Format error response konsisten untuk 400/404/500.
- [ ] Error dari `ValidationPipe` tidak “hilang”, pesan tetap terbaca oleh client.
- [ ] `notes-step-08-exception-filters.md` berisi refleksi singkatmu.

---

## 10. Tantangan Tambahan (Opsional)

- **Tantangan 1 – Pisahkan details untuk dev vs prod**
  - Buat agar `details` hanya muncul di environment development.

- **Tantangan 2 – Error code internal**
  - Tambahkan field seperti `error.code` (contoh: `COURSE_NOT_FOUND`) untuk memudahkan frontend melakukan mapping pesan.

- **Tantangan 3 – Logging yang lebih rapi**
  - Jika ada `requestId`, gunakan itu untuk mengelompokkan log error.
  - (Opsional) tulis log berbeda untuk 4xx vs 5xx.

