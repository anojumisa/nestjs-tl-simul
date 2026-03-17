# Step 05 – DTO dan Pipes di NestJS

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** apa itu DTO (Data Transfer Object) dan kenapa dipakai di NestJS.
- **Memahami** peran Pipes dalam alur request dan perbedaan validasi vs transformasi.
- **Mampu menggunakan** `ValidationPipe` global beserta `class-validator` dan `class-transformer`.
- **Mampu menulis** DTO yang divalidasi dengan decorator yang tepat.
- **Mengetahui** bentuk response error ketika validasi gagal.

---

## 2. Apa itu DTO (Data Transfer Object)?

### 2.1. Definisi dan Tujuan

**DTO** adalah objek yang mendefinisikan **bentuk data** yang dikirim atau diterima oleh aplikasi, biasanya antara client (browser, Postman, frontend) dan server.

Di NestJS, DTO sering dipakai untuk:

- **Request body** – data yang dikirim client lewat `POST`, `PUT`, `PATCH`.
- **Query parameters** – misalnya `?page=1&limit=10`.
- **Response** – (opsional) untuk memastikan bentuk data yang dikembalikan konsisten.

Tujuan utama DTO:

1. **Kontrak yang jelas** – client dan server sepakat tentang nama field dan tipe data.
2. **Validasi** – memastikan data yang masuk memenuhi aturan (required, format, range, dll.) sebelum masuk ke service.
3. **Keamanan** – hanya field yang didefinisikan di DTO yang dianggap valid; field lain bisa diabaikan atau ditolak.
4. **Dokumentasi** – DTO + Swagger/OpenAPI membuat dokumentasi API otomatis.

### 2.2. DTO vs Entity

| Aspek        | DTO                          | Entity / Model                 |
|-------------|------------------------------|--------------------------------|
| Fokus       | Data masuk/keluar API        | Data di dalam aplikasi/domain  |
| Dipakai di  | Controller (body, query)     | Service, Repository             |
| Sering berisi | Hanya field yang relevan   | Semua field + relasi (nanti)   |
| Validasi    | Ya (class-validator)          | Bisa, tapi fokus ke aturan domain |

Contoh: `CreateCourseDto` punya `title` dan `description`; entity `Course` punya `id`, `title`, `description`, dan nanti field lain dari database.

---

## 3. Apa itu Pipes di NestJS?

### 3.1. Peran Pipes

**Pipe** adalah class yang NestJS panggil **sebelum** handler controller dijalankan. Pipes bisa:

- **Transform** – mengubah nilai (misalnya string `"123"` jadi number `123`).
- **Validate** – memeriksa data; jika tidak valid, Pipe melempar exception dan request tidak sampai ke handler.

Alur singkat:

```text
Request masuk → Pipes (transform/validate) → Guard (opsional) → Interceptor (opsional) → Controller handler → Response
```

Jika Pipe melempar exception (misalnya karena validasi gagal), Nest mengembalikan response error dan handler **tidak** dijalankan.

### 3.2. Built-in Pipes

NestJS menyediakan beberapa pipe bawaan:

| Pipe             | Kegunaan singkat                                      |
|------------------|--------------------------------------------------------|
| `ValidationPipe` | Validasi object (biasanya body) dengan class-validator |
| `ParseIntPipe`   | Mengubah string jadi integer (misalnya `:id` di URL)   |
| `ParseBoolPipe`  | Mengubah string jadi boolean                           |
| `ParseUUIDPipe`  | Memastikan string adalah UUID                         |
| `DefaultValuePipe`| Memberi nilai default jika query/param kosong          |

Contoh di controller:

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.coursesService.findOne(id);
}
```

Di sini, `ParseIntPipe` akan:

- Mengubah `id` dari string (dari URL) menjadi number.
- Jika tidak bisa di-parse (misalnya `"abc"`), Nest otomatis mengembalikan error 400.

### 3.3. ValidationPipe dan Integrasi dengan DTO

`ValidationPipe` adalah pipe yang:

- Bekerja dengan **class** (biasanya DTO).
- Memakai library **class-validator** (dan **class-transformer**) untuk:
  - Memvalidasi property berdasarkan decorator.
  - Opsional: mengubah plain object menjadi instance class (transform).

Cara pakai yang umum: **global pipe** di `main.ts`, sehingga setiap endpoint yang memakai DTO di body/query/param otomatis divalidasi.

### 3.4. Di Mana Pipe dan DTO Digunakan?

Penting untuk bedakan **tempat pakai Pipe** dan **tempat pakai DTO**:

- **Pipes** dipakai pada **parameter** handler:
  - `@Param()` – biasanya untuk segment URL seperti `:id`.
  - `@Query()` – untuk query string seperti `?page=1&limit=10`.
  - `@Body()` – untuk request body (JSON) di POST/PUT/PATCH.
- **DTO** dipakai untuk **bentuk data** di `@Body()` dan `@Query()` (dan kadang untuk response).

Contoh umum di controller:

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.coursesService.findOne(id);
}

@Post()
create(@Body() dto: CreateCourseDto) {
  return this.coursesService.create(dto);
}

@Get()
findAll(@Query() query: PaginationQueryDto) {
  return this.coursesService.findAll(query);
}
```

Penjelasan:

- `@Param('id', ParseIntPipe) id: number`
  - Di sini kita **hanya pakai Pipe** (`ParseIntPipe`) untuk mengubah `id` dari string → number dan menolak nilai yang tidak valid.
  - Tidak perlu DTO khusus hanya untuk satu angka `id`.

- `@Body() dto: CreateCourseDto`
  - Di sini kita pakai **DTO** (`CreateCourseDto`) untuk mendefinisikan bentuk body.
  - **ValidationPipe** (global) akan membaca decorator di `CreateCourseDto` dan memvalidasi body otomatis.
  - Jadi: DTO + ValidationPipe = pasangan untuk body.

- `@Query() query: PaginationQueryDto`
  - Mirip dengan body: DTO mendefinisikan field query (`page`, `limit`), ValidationPipe memvalidasi dan mentransformasi.

**Ringkasnya:**

- Pipe **bukan hanya untuk** `@Get()`.  
  Pipe bekerja di **param, query, dan body** tergantung di mana kamu pasang:
  - Param → sering pakai pipe tipe (misalnya `ParseIntPipe`).
  - Body/Query → sering pakai DTO + `ValidationPipe`.

- DTO **tidak menggantikan** pipe.  
  Untuk body/query:
  - DTO = bentuk datanya.
  - Pipe (`ValidationPipe`) = mesin yang menjalankan aturan validasi di DTO.

### 3.5. Kenapa Kita Butuh Pipe?

Pipe punya dua peran utama:

1. **Transform** – mengubah data mentah dari request (di HTTP semua datang sebagai string) menjadi bentuk yang siap dipakai di kode (number, boolean, instance class, dll.).
2. **Validate** – memastikan data itu “sah” (tipe benar, format benar, aturan terpenuhi) **sebelum** masuk ke controller/service.

Tanpa pipe, kamu harus menulis logic transform dan validasi itu **sendiri** di dalam controller atau service. Pipe memusatkan dan memakai ulang logic itu, sehingga controller tetap ringan dan konsisten.

### 3.6. Boleh Tidak Pakai Pipe?

**Boleh.** Tidak ada kewajiban memakai pipe; aplikasi tetap bisa jalan.

Yang terjadi adalah: kamu harus **manual** mengubah tipe (misalnya `req.params.id` string → number) dan **manual** cek validasi di setiap handler. Risiko typo, lupa cek di satu endpoint, atau response error tidak seragam jadi lebih besar.

Kesimpulannya: pipe **tidak wajib**, tapi sangat disarankan agar kode lebih aman dan teratur.

### 3.7. Dampak Jika Tidak Memakai Pipe

#### 3.7.1. Param dan query tetap string

Di HTTP, segment URL dan query **selalu** string. Contoh: `GET /courses/123` → `params.id === "123"` (string).

Tanpa `ParseIntPipe` (atau transform lain), di service kamu mungkin pakai `id` seperti number, padahal dapat string. Bisa berbahaya kalau dikirim ke query DB (beberapa driver/ORM bisa salah interpretasi). Bug halus: `id === 123` vs `id === "123"` di JavaScript bisa beda hasil.

**Dampak:** Perilaku tidak terduga, bug tersembunyi, atau error di layer bawah (misalnya database).

#### 3.7.2. Tidak ada validasi terpusat untuk body/query

Tanpa `ValidationPipe` (dan class-validator), kamu harus sendiri cek: field wajib ada, tipe benar, panjang minimal, format email, dll. Banyak duplikasi dan mudah lupa di satu endpoint. Kalau validasi di dalam service, service jadi penuh dengan “if-invalid-throw”, bukan fokus ke business logic.

**Dampak:** Data kotor/salah bisa masuk ke service dan DB; aplikasi lebih rentan error atau data tidak konsisten.

#### 3.7.3. Keamanan dan whitelist

Dengan `ValidationPipe` dan opsi seperti `whitelist: true` / `forbidNonWhitelisted: true`, hanya field yang ada di DTO yang diterima. Field tambahan dari client (sengaja atau tidak) bisa dibuang atau ditolak.

Tanpa ini, client bisa mengirim field apa saja. Kalau kamu tidak hati-hati (misalnya menyimpan ke DB tanpa filter), bisa terjadi **mass assignment** – client mengirim `isAdmin: true` dan kamu tanpa sengaja menyimpannya. Atau setidaknya “sampah” masuk ke log/object dan bikin bingung.

**Dampak:** Risiko keamanan dan data yang tidak terkontrol.

#### 3.7.4. Response error tidak konsisten

Dengan pipe bawaan (misalnya `ParseIntPipe`, `ValidationPipe`), NestJS mengembalikan error dengan format standar (status code, `message`, `error`). Tanpa pipe, kalau kamu validasi manual, setiap developer bisa menulis response error berbeda-beda; frontend harus handle banyak format → lebih rumit.

**Dampak:** API tidak konsisten, frontend lebih susah dan rawan bug.

#### 3.7.5. Controller dan service jadi “kotor”

Tanpa pipe, handler bisa jadi seperti ini:

```typescript
@Post()
create(@Body() body: any) {
  if (!body.title || typeof body.title !== 'string') {
    throw new BadRequestException('title wajib string');
  }
  if (body.title.length < 3) {
    throw new BadRequestException('Judul minimal 3 karakter');
  }
  // ... hal yang sama untuk description dan field lain
  return this.coursesService.create(body);
}
```

Logic validasi dan transform numpuk di controller. Dengan pipe (dan DTO + class-validator), controller cukup:

```typescript
@Post()
create(@Body() dto: CreateCourseDto) {
  return this.coursesService.create(dto);
}
```

**Dampak:** Kode lebih panjang, sulit dirawat, dan mudah tidak konsisten antar endpoint.

#### Ringkasan perbandingan

| Tanpa pipe | Dengan pipe |
|------------|-------------|
| Param/query tetap string, risiko salah tipe | Transform otomatis (misalnya id → number) |
| Validasi manual di tiap handler | Validasi terpusat lewat DTO + ValidationPipe |
| Risiko terima field berbahaya dari client | Bisa whitelist field (hanya yang di DTO) |
| Format error bisa beda-beda | Format error standar dari NestJS |
| Controller penuh validasi/transform | Controller ringan, fokus orkestrasi |

**Kesimpulan:** Boleh tidak pakai pipe, tapi dampaknya adalah lebih banyak kerja manual, risiko bug/keamanan, dan kode yang lebih berantakan. Pakai pipe (terutama ValidationPipe + ParseIntPipe untuk `:id`) sangat disarankan untuk production dan untuk pembelajaran yang rapi.

---

## 4. Setup Validasi: class-validator dan ValidationPipe

### 4.1. Install Package

```bash
pnpm add class-validator class-transformer
# atau npm install / yarn add
```

- **class-validator** – decorator untuk aturan validasi (`@IsString()`, `@IsNotEmpty()`, `@MinLength()`, dll.).
- **class-transformer** – mengubah plain object (dari JSON) menjadi instance class, agar decorator class-validator bisa jalan.

### 4.2. Mengaktifkan ValidationPipe Global

Di `src/main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

Penjelasan opsi:

| Opsi                  | Makna singkat                                                                 |
|-----------------------|-------------------------------------------------------------------------------|
| `whitelist: true`     | Field yang tidak ada di DTO akan **dibuang** dari object yang sampai ke handler. |
| `forbidNonWhitelisted: true` | Jika client mengirim field yang tidak ada di DTO, response **400** dan pesan error. |
| `transform: true`     | Plain object diubah jadi instance class DTO; juga mengubah tipe primitif (string→number, dll.) bila memungkinkan. |
| `enableImplicitConversion` | Mengizinkan konversi tipe otomatis (misalnya query `?page=1` jadi number) tanpa decorator tambahan. |

Dengan ini, setiap parameter yang bertipe **class** (DTO) akan divalidasi oleh `ValidationPipe`.

---

## 5. Menulis DTO dengan Validasi

### 5.1. CreateCourseDto

Contoh DTO untuk membuat course baru:

```typescript
// src/courses/dto/create-course.dto.ts
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Fundamental NestJS', description: 'Judul course' })
  @IsString()
  @IsNotEmpty({ message: 'Judul course tidak boleh kosong' })
  @MinLength(3, { message: 'Judul minimal 3 karakter' })
  @MaxLength(100, { message: 'Judul maksimal 100 karakter' })
  title: string;

  @ApiProperty({ example: 'Kelas pengantar NestJS.', description: 'Deskripsi course' })
  @IsString()
  @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
  @MinLength(10, { message: 'Deskripsi minimal 10 karakter' })
  description: string;
}
```

Penjelasan decorator:

- **@IsString()** – nilai harus bertipe string.
- **@IsNotEmpty()** – tidak boleh string kosong atau null/undefined.
- **@MinLength(n)** / **@MaxLength(n)** – panjang string.
- **message** – pesan error kustom yang akan muncul di response.

### 5.2. UpdateCourseDto (Partial)

Untuk update, field biasanya **opsional**; hanya field yang dikirim yang akan di-update:

```typescript
// src/courses/dto/update-course.dto.ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Fundamental NestJS (Updated)' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Judul minimal 3 karakter' })
  @MaxLength(100, { message: 'Judul maksimal 100 karakter' })
  title?: string;

  @ApiPropertyOptional({ example: 'Deskripsi yang diperbarui.' })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Deskripsi minimal 10 karakter' })
  description?: string;
}
```

**@IsOptional()** – field boleh tidak dikirim; kalau dikirim, aturan lain (IsString, MinLength, dll.) tetap berlaku.

### 5.3. DTO untuk Query Parameter (Opsional)

Contoh validasi query untuk paginasi:

```typescript
// src/courses/dto/pagination-query.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
```

Di controller:

```typescript
@Get()
findAll(@Query() query: PaginationQueryDto) {
  return this.coursesService.findAll(query);
}
```

**@Type(() => Number)** – dari `class-transformer` – mengubah string dari query (`?page=1`) menjadi number sebelum divalidasi. Penting jika `transform: true` dan query selalu datang sebagai string.

---

## 6. Bentuk Response Error saat Validasi Gagal

Ketika validasi gagal, NestJS (lewat ValidationPipe) mengembalikan status **400 Bad Request** dengan body kurang lebih seperti:

```json
{
  "statusCode": 400,
  "message": [
    "Judul course tidak boleh kosong",
    "Judul minimal 3 karakter"
  ],
  "error": "Bad Request"
}
```

Atau jika `forbidNonWhitelisted: true` dan client mengirim field yang tidak dikenal:

```json
{
  "statusCode": 400,
  "message": [
    "property unknownField should not exist"
  ],
  "error": "Bad Request"
}
```

Mahasiswa bisa memakai response ini untuk:

- Debug di Postman/Thunder Client.
- Menampilkan pesan error ke user di frontend.

---

## 7. Ringkasan Alur: Dari Request ke Handler

1. Client mengirim **POST /courses** dengan body JSON.
2. NestJS mengubah body menjadi plain object.
3. **ValidationPipe** (global):
   - Mengubah plain object menjadi instance **CreateCourseDto** (dengan class-transformer).
   - Menjalankan validasi class-validator pada setiap property.
4. Jika ada yang gagal → exception → response 400, handler tidak dipanggil.
5. Jika lolos → object yang sampai ke controller sudah valid dan bertipe CreateCourseDto; handler memanggil service.

---

## 8. Tugas Mandiri (Wajib)

1. **Pasang dan aktifkan ValidationPipe**
   - Install `class-validator` dan `class-transformer`.
   - Tambahkan `app.useGlobalPipes(new ValidationPipe({ ... }))` di `main.ts` dengan opsi `whitelist`, `forbidNonWhitelisted`, `transform`.

2. **Lengkapi CreateCourseDto dan UpdateCourseDto**
   - Tambahkan decorator validasi yang sesuai (IsString, IsNotEmpty, MinLength, MaxLength, IsOptional).
   - Beri pesan error yang jelas dalam Bahasa Indonesia.

3. **Tes skenario validasi**
   - Di Postman/Swagger:
     - Body kosong → harapkan 400.
     - `title` kurang dari 3 karakter → 400.
     - Kirim field yang tidak ada di DTO (misalnya `extraField`) → 400 jika `forbidNonWhitelisted: true`.
   - Catat contoh response error di notes.

4. **Gunakan ParseIntPipe untuk :id**
   - Pastikan endpoint `GET /courses/:id` (dan PATCH/DELETE) memakai `ParseIntPipe` untuk param `id`.
   - Tes dengan URL `GET /courses/abc` → harapkan 400.

5. **Catatan `notes-step-05-dto-pipes.md`**
   - Jelaskan dengan kalimatmu: apa beda DTO dan Entity?
   - Apa yang terjadi jika kita tidak memakai ValidationPipe?
   - Sebut satu skenario di mana validasi di backend menyelamatkan aplikasi dari data yang salah.

---

## 9. Checklist Penilaian

Kamu dianggap **lulus Step 05** jika:

- [ ] ValidationPipe global aktif dan DTO Course memakai class-validator.
- [ ] CreateCourseDto dan UpdateCourseDto memiliki aturan validasi yang masuk akal (min/max length, required/optional).
- [ ] Request yang tidak valid (body salah, field berlebih) mengembalikan 400 dengan pesan yang jelas.
- [ ] Param `id` di route divalidasi/parse dengan ParseIntPipe.
- [ ] Notes berisi refleksi tentang DTO, Pipes, dan pentingnya validasi di backend.

---

## 10. Tantangan Tambahan (Opsional)

- **Custom pipe** – Buat pipe sederhana yang mengubah string kosong menjadi `undefined` untuk query param tertentu.
- **Validasi lanjutan** – Tambahkan aturan `@Matches(/regex/)` untuk format tertentu (misalnya kode course harus huruf-angka).
- **Exception filter** – Eksplorasi membuat filter yang mengubah format response error validasi agar sesuai standar tim (misalnya selalu `{ success: false, errors: [...] }`).

---

## 11. Alternatif Validasi: Zod (Topik Lanjutan)

> Bagian ini **opsional** / lanjutan. Fokus utama mentoring tetap pada DTO + `class-validator`. Zod diperkenalkan sebagai alternatif modern yang banyak dipakai di ekosistem TypeScript.

### 11.1. Zod itu apa?

**Zod** adalah library **schema validation** untuk TypeScript/JavaScript.

Dengan Zod, kita:

1. Mendefinisikan **schema** (bentuk data) dalam kode.
2. Menggunakan schema itu untuk:
   - **Validasi runtime** – memastikan data yang masuk sesuai aturan.
   - **Tipe TypeScript** – Zod bisa menghasilkan tipe dari schema.

Contoh sederhana:

```typescript
import { z } from 'zod';

const CourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
});

// tipe TS otomatis
type Course = z.infer<typeof CourseSchema>;

// validasi runtime
const course = CourseSchema.parse({
  title: 'Fundamental NestJS',
  description: 'Kelas pengantar NestJS.',
});
```

Kalau data yang di-`parse` tidak sesuai schema, Zod akan melempar error dengan detail kenapa gagal.

---

### 11.2. Bedanya Zod dengan `class-validator` + DTO Nest

**Pola Nest “klasik” (yang kita pakai di step ini):**

- DTO = class
- Aturan validasi = decorator `class-validator`
- Eksekusi validasi = `ValidationPipe` Nest

```typescript
export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;
}
```

**Pola dengan Zod:**

- Schema didefinisikan dengan cara **fungsional** (bukan class + decorator).
- Satu schema bisa:
  - Dipakai untuk validasi runtime (`parse`),
  - Dipakai untuk tipe TS (`z.infer`),
  - Dipakai di sisi lain aplikasi (misal frontend) jika dibagikan.

```typescript
const CreateCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
});

type CreateCourseZodDto = z.infer<typeof CreateCourseSchema>;
```

Untuk NestJS, biasanya kita butuh **pipe khusus** (atau package integrasi) yang:

- Menerima body dari request,
- Memanggil `CreateCourseSchema.parse(body)`,
- Kalau valid → lanjut ke handler,
- Kalau tidak valid → lempar `BadRequestException` dengan detail error Zod.

---

### 11.3. Kapan orang memilih Zod?

Beberapa alasan banyak developer suka Zod:

- **Satu sumber kebenaran (single source of truth)**  
  Satu schema Zod bisa dipakai untuk:
  - Validasi backend,
  - Tipe TS di backend,
  - Validasi di frontend (misalnya untuk form),
  - Kadang generate OpenAPI/JSON Schema lewat tools tambahan.

- **Gaya deklaratif & fungsional**  
  Tidak perlu class dan decorator; semua lewat fungsi (`z.string()`, `z.number()`, `z.enum([...])`, dll).

- **Bisa dipakai di luar Nest**  
  Zod tidak tergantung pada Nest; bisa dipakai di:
  - Script Node biasa,
  - Next.js / React front-end,
  - Cloud Functions, dsb.

**Di konteks mentoring ini:**

- Untuk pemula NestJS, `class-validator` + DTO:
  - Paling dekat dengan dokumentasi resmi Nest,
  - Banyak contoh di internet,
  - Integrasinya “tinggal pakai” lewat `ValidationPipe`.

Zod lebih cocok sebagai **topik lanjutan** setelah mahasiswa nyaman dengan konsep DTO & Pipes.

---

### 11.4. Ilustrasi Integrasi Sederhana Zod di NestJS (Konsep)

Ini hanya **gambaran konsep**, bukan langkah yang wajib kamu implementasi sekarang.

1. Definisikan schema Zod:

   ```typescript
   import { z } from 'zod';

   export const CreateCourseSchema = z.object({
     title: z.string().min(3).max(100),
     description: z.string().min(10),
   });

   export type CreateCourseZodDto = z.infer<typeof CreateCourseSchema>;
   ```

2. Buat pipe sederhana yang menjalankan Zod:

   ```typescript
   import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
   import { ZodSchema } from 'zod';

   export class ZodValidationPipe implements PipeTransform {
     constructor(private readonly schema: ZodSchema) {}

     transform(value: unknown, metadata: ArgumentMetadata) {
       const result = this.schema.safeParse(value);
       if (!result.success) {
         // di sini kamu bisa format error Zod sesuai kebutuhan
         throw new BadRequestException(result.error.flatten());
       }
       return result.data;
     }
   }
   ```

3. Pakai di controller:

   ```typescript
   @Post()
   create(@Body(new ZodValidationPipe(CreateCourseSchema)) body: CreateCourseZodDto) {
     return this.coursesService.create(body);
   }
   ```

Dengan pola ini:

- Kamu **tidak pakai lagi** `class-validator`/DTO untuk endpoint ini,
- Tapi pakai Zod schema + pipe khusus.

**Sekali lagi:** ini pola lanjutan; untuk mentoring dasar, kita tetap fokus pada:

- DTO (class) + `class-validator` + `ValidationPipe`  
  … lalu di sesi advanced kamu bisa tunjukkan “ini lho alternatif lain: Zod”.

---

### 11.5. Apakah Kita Wajib Pindah ke Zod?

Tidak.

- **Untuk mentoring ini**:
  - DTO + `class-validator` sudah sangat cukup,
  - Lebih mudah diikuti karena sinkron dengan dokumentasi resmi Nest.
- **Zod** bisa kamu anggap sebagai:
  - “tool tambahan” untuk tim yang ingin:
    - Menyatukan schema antara backend dan frontend,
    - Menghindari decorator-style,
    - Atau membangun arsitektur yang sangat schema-driven.

Yang penting mahasiswa pahami:

- **Konsep** validasi & schema-nya (apa yang dicek, kenapa perlu),
- Bukan sekadar “pakai library mana”.

