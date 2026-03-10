# Step 02 – Module, Controller, & Service Pertama (Course)

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** peran `Module`, `Controller`, dan `Service` di NestJS.
- **Mampu membuat** module, controller, dan service baru untuk resource `Course`.
- **Mengerti** konsep dasar **Dependency Injection (DI)** di Nest.
- **Mengimplementasikan** endpoint sederhana untuk Course (belum pakai database, masih in-memory).

---

## 2. Konsep Singkat

### 2.1. Module

- Module adalah cara Nest mengelompokkan fitur.
- Contoh: `CoursesModule` untuk semua hal yang berhubungan dengan Course.
- Module mendeklarasikan:
  - **providers** (service, dsb.),
  - **controllers**, dan
  - apa yang diekspor ke module lain.

### 2.2. Controller

- Tempat mendefinisikan **HTTP route** (GET/POST/PUT/DELETE).
- Menerima request dari client (body, params, query).
- Mendelegasikan **business logic** ke **Service**.

### 2.3. Service

- Berisi **business logic**.
- Biasanya berupa class dengan metode-metode yang dipakai oleh Controller.
- Diinject ke Controller melalui constructor (**Dependency Injection**).

### 2.4. Dependency Injection (DI) di NestJS

- Daripada membuat objek sendiri di dalam controller, Nest akan:
  - membuat instance service,
  - dan “menyuntikkannya” ke constructor controller.
- Hal ini memudahkan:
  - testing,
  - reuse,
  - dan pemisahan tanggung jawab.

---

## 3. Langkah Praktis – Membuat `Courses` Module

> Untuk step ini, kita belum pakai database. Data Course akan disimpan dalam **array di memory** sebagai simulasi.

### 3.1. Generate Module, Controller, dan Service

Di terminal, dari root project:

```bash
nest g module courses
nest g controller courses
nest g service courses
```

Perintah ini akan membuat:

- `src/courses/courses.module.ts`
- `src/courses/courses.controller.ts`
- `src/courses/courses.service.ts`

Dan otomatis mendaftarkan module di `app.module.ts` (cek dan pahami perubahan yang terjadi).

---

## 4. Struktur Folder & Kode Referensi

### 4.1. Struktur Folder Disarankan

```text
src/
  app.module.ts
  app.controller.ts
  app.service.ts
  courses/
    courses.module.ts
    courses.controller.ts
    courses.service.ts
    dto/
      create-course.dto.ts
      update-course.dto.ts
```

### 4.2. `src/app.module.ts` (update)

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [CoursesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Penjelasan singkat:**

- Di sini kamu menghubungkan **root module** (`AppModule`) dengan **feature module** baru yaitu `CoursesModule`.
- Dengan menaruh `CoursesModule` di array `imports`, NestJS tahu bahwa semua controller dan service yang didefinisikan di module tersebut sekarang menjadi bagian dari aplikasi.
- Tujuan utamanya: memberi tahu Nest bahwa fitur “course” sudah resmi terdaftar dan siap dipakai.

### 4.3. `src/courses/courses.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
```

**Penjelasan singkat:**

- `CoursesModule` adalah module khusus untuk fitur **Course**.
- Di dalamnya kamu mendeklarasikan siapa **controller**-nya (`CoursesController`) dan siapa **service**-nya (`CoursesService`).
- Tujuan utamanya: mengelompokkan semua hal terkait Course di satu tempat, sehingga struktur project lebih rapi dan mudah dikembangkan.

### 4.4. DTO Sederhana

`src/courses/dto/create-course.dto.ts`:

```typescript
export class CreateCourseDto {
  title: string;
  description: string;
}
```

`src/courses/dto/update-course.dto.ts`:

```typescript
export class UpdateCourseDto {
  title?: string;
  description?: string;
}
```

**Penjelasan singkat:**

- DTO (`CreateCourseDto`, `UpdateCourseDto`) mendefinisikan **bentuk data** yang dikirim client ke server untuk operasi create/update Course.
- Dengan DTO, kamu punya satu sumber kebenaran untuk struktur data yang diterima endpoint, yang nanti bisa dipakai juga untuk validasi di Step berikutnya.
- Tujuan utamanya: memisahkan **data input** dari model internal, supaya lebih aman, jelas, dan mudah di-maintain.

---

## 5. Implementasi Service In-Memory

`src/courses/courses.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

export interface Course {
  id: number;
  title: string;
  description: string;
}

@Injectable()
export class CoursesService {
  private courses: Course[] = [];
  private nextId = 1;

  findAll(): Course[] {
    return this.courses;
  }

  findOne(id: number): Course {
    const course = this.courses.find((c) => c.id === id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  create(createCourseDto: CreateCourseDto): Course {
    const newCourse: Course = {
      id: this.nextId++,
      title: createCourseDto.title,
      description: createCourseDto.description,
    };

    this.courses.push(newCourse);
    return newCourse;
  }

  update(id: number, updateCourseDto: UpdateCourseDto): Course {
    const course = this.findOne(id);

    if (typeof updateCourseDto.title === 'string') {
      course.title = updateCourseDto.title;
    }
    if (typeof updateCourseDto.description === 'string') {
      course.description = updateCourseDto.description;
    }

    return course;
  }

  remove(id: number): void {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    this.courses.splice(index, 1);
  }
}
```

**Penjelasan singkat:**

- `CoursesService` menyimpan **business logic** terkait Course: bagaimana data Course disimpan, dicari, diupdate, dan dihapus.
- Saat ini data masih disimpan di **array in-memory**, tapi nanti di Step lanjutan kamu akan menggantinya dengan database tanpa perlu mengubah controller terlalu banyak.
- Tujuan utamanya: memisahkan logika “mengelola Course” dari layer HTTP, sehingga lebih mudah di-test dan di-refactor.

---

## 6. Implementasi Controller

`src/courses/courses.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    this.coursesService.remove(id);
    return { message: `Course with id ${id} deleted` };
  }
}
```

**Penjelasan singkat:**

- `CoursesController` adalah **gerbang HTTP** untuk semua operasi terkait Course (`GET`, `POST`, `PATCH`, `DELETE`).
- Ia menerima request dari client (path param, body), lalu memanggil method yang sesuai di `CoursesService`.
- Tujuan utamanya: memetakan URL dan HTTP method ke aksi tertentu di service, sehingga struktur API kamu jelas dan terorganisir.

---

## 7. Tugas Mandiri (Wajib)

1. **Implementasi penuh `CoursesService` (in-memory)**  
   Minimal method:
   - `findAll`
   - `findOne`
   - `create`  
   Ideal jika juga ada:
   - `update`
   - `remove`

2. **Lengkapi `CoursesController`**
   - Endpoint wajib:
     - `GET /courses`
     - `GET /courses/:id`
     - `POST /courses`
   - Jika ada waktu, tambah:
     - `PATCH /courses/:id`
     - `DELETE /courses/:id`

3. **Test dengan Postman / Thunder Client / Insomnia**
   - Buat minimal 1 Course baru dengan `POST /courses`.
   - Ambil semua Course dengan `GET /courses`.
   - Ambil Course tertentu dengan `GET /courses/:id`.

4. **Catatan `notes-step-02.md`**  
   Tuliskan:
   - Apa perbedaan peran `Controller` dan `Service` menurutmu?
   - Jelaskan dengan kalimatmu sendiri: apa itu Dependency Injection di Nest?
   - Gambarkan (boleh teks saja) alur `GET /courses` dari client sampai response.

---

## 8. Checklist Penilaian

Kamu dianggap **lulus Step 02** jika:

- [ ] `CoursesModule`, `CoursesController`, dan `CoursesService` sudah terbentuk dan terhubung.
- [ ] Endpoint `GET /courses` mengembalikan list Course (meskipun datanya masih kosong di awal).
- [ ] Endpoint `POST /courses` bisa menambahkan Course baru ke dalam array in-memory.
- [ ] Endpoint `GET /courses/:id` bisa mengambil Course berdasarkan `id`.
- [ ] Kamu dapat menjelaskan dengan kata-katamu sendiri:
  - perbedaan `Controller` vs `Service`,
  - dan konsep dasar DI.

---

## 9. Tantangan Tambahan (Opsional)

- **Tantangan 1 – Validasi Manual**  
  Tambahkan pengecekan sederhana di `create()`:
  - Jika `title` kosong, kembalikan error (bisa pakai `throw new Error()` dulu, nanti di step berikutnya kita rapikan dengan Nest exception handling).

- **Tantangan 2 – Pencarian Course**  
  Tambahkan endpoint `GET /courses/search?title=...` yang mengembalikan Course yang judulnya mengandung keyword tertentu (case-insensitive).

- **Tantangan 3 – Refaktor ke DTO**  
  Walaupun belum pakai `class-validator`, refaktor parameter `createCourseDto` dan `updateCourseDto` menggunakan class DTO, bukan `any` atau object literal.

