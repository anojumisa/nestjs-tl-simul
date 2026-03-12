# Step 03 – Advanced Repository Pattern untuk Course

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** apa itu *repository pattern* dan kenapa dipakai di backend.
- **Membedakan** peran Controller, Service, dan Repository dengan lebih jelas.
- **Menambahkan** layer repository baru di antara service dan lapisan data (saat ini in-memory, nanti bisa Prisma).
- **Menulis** service yang bergantung pada *abstraksi* (interface), bukan langsung ke detail teknis ORM.

> Catatan: Di step ini kita **belum** pakai Prisma dulu. Kita akan menyiapkan pola repository-nya dengan implementasi sederhana, sehingga nanti ketika pindah ke Prisma, kamu hanya perlu mengganti implementasi repository tanpa mengubah service.

---

## 2. Recap Arsitektur Saat Ini (Setelah Step 02)

Setelah Step 02, alurnya kurang lebih:

```text
Client (Postman / Frontend)
    ↓
CoursesController   (HTTP layer: route, params, body)
    ↓
CoursesService      (business logic + simpan data di array)
    ↓
In-memory array     (data disimpan di memori proses Node)
```

- `CoursesController`:
  - Menerima request HTTP (`GET /courses`, `POST /courses`, dst.).
  - Memanggil method di `CoursesService`.
- `CoursesService`:
  - Menyimpan dan mengelola data course langsung di dalam array (`this.courses`).

Ini sudah bagus untuk level awal, tapi:

- Service masih **menyentuh detail penyimpanan** (array sekarang, nanti database).
- Saat nanti kita pakai Prisma, service yang sama akan harus tahu tentang Prisma Client → coupling tinggi.

---

## 3. Kenalan dengan Repository Pattern

**Repository pattern** adalah pola di mana kita:

- Mendefinisikan **lapisan perantara** antara business logic (Service) dan detail penyimpanan data (ORM, API lain, file, dsb.).
- Service hanya berinteraksi dengan **interface repository**, bukan langsung dengan Prisma / TypeORM / array.

Konsep sederhananya:

```text
Controller → Service → Repository → (ORM / DB / In-memory)
```

Manfaat:

- Service menjadi lebih fokus ke **aturan bisnis**, bukan ke detail query.
- Lebih mudah **ganti teknologi** (misalnya dari in-memory ke Prisma).
- Lebih mudah untuk **unit test**: kita bisa mock repository tanpa harus nyalakan database.

---

## 4. Desain Layer Baru untuk Course

Kita akan menambahkan struktur seperti ini:

```text
src/
  courses/
    courses.module.ts
    courses.controller.ts
    courses.service.ts
    dto/
      create-course.dto.ts
      update-course.dto.ts
    repositories/
      course-repository.interface.ts
      in-memory-course.repository.ts
```

Tujuannya:

- `ICourseRepository` → kontrak (interface) yang mendefinisikan operasi data yang dibutuhkan fitur Course.
- `InMemoryCourseRepository` → implementasi sementara yang memakai array di memori (nantinya bisa diganti implementasi `PrismaCourseRepository`).
- `CoursesService` → hanya bergantung pada `ICourseRepository`, tidak peduli apakah di bawahnya array atau Prisma.

---

## 5. Mendefinisikan Interface Repository

Buat file interface (konsep, kode bisa kamu taruh di `src/courses/repositories/course-repository.interface.ts`):

```typescript
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

export type CourseId = number;

export interface CourseModel {
  id: CourseId;
  title: string;
  description: string;
}

export interface ICourseRepository {
  findAll(): Promise<CourseModel[]>;
  findOne(id: CourseId): Promise<CourseModel | null>;
  create(data: CreateCourseDto): Promise<CourseModel>;
  update(id: CourseId, data: UpdateCourseDto): Promise<CourseModel | null>;
  remove(id: CourseId): Promise<boolean>;
}
```

**Penjelasan singkat:**

- `CourseModel` adalah representasi data course di level repository (saat ini mirip entity, nanti bisa di-mapping dari / ke Prisma model).
- `ICourseRepository` mendeskripsikan operasi data yang dibutuhkan service:
  - Ambil semua course, ambil satu course, buat baru, update, hapus.
- Di sini **belum ada** TypeORM atau Prisma – ini murni kontrak TypeScript.

---

## 6. Implementasi Repository In-Memory

Sekarang kita buat implementasi awal yang masih memakai array, tapi **melalui repository**, bukan lagi langsung di service.

```typescript
import { Injectable } from '@nestjs/common';
import { ICourseRepository, CourseModel, CourseId } from './course-repository.interface';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@Injectable()
export class InMemoryCourseRepository implements ICourseRepository {
  private courses: CourseModel[] = [];
  private nextId = 1;

  async findAll(): Promise<CourseModel[]> {
    return this.courses;
  }

  async findOne(id: CourseId): Promise<CourseModel | null> {
    const course = this.courses.find((c) => c.id === id);
    return course ?? null;
  }

  async create(data: CreateCourseDto): Promise<CourseModel> {
    const newCourse: CourseModel = {
      id: this.nextId++,
      title: data.title,
      description: data.description,
    };

    this.courses.push(newCourse);
    return newCourse;
  }

  async update(id: CourseId, data: UpdateCourseDto): Promise<CourseModel | null> {
    const existing = this.courses.find((c) => c.id === id);
    if (!existing) {
      return null;
    }

    if (typeof data.title === 'string') {
      existing.title = data.title;
    }
    if (typeof data.description === 'string') {
      existing.description = data.description;
    }

    return existing;
  }

  async remove(id: CourseId): Promise<boolean> {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index === -1) {
      return false;
    }

    this.courses.splice(index, 1);
    return true;
  }
}
```

**Penjelasan singkat:**

- Functionalitasnya mirip dengan `CoursesService` di Step 02, tapi sekarang logika akses datanya ditempatkan di **repository**.
- Nanti, ketika kamu ganti ke Prisma:
  - Kamu cukup membuat `PrismaCourseRepository` yang juga mengimplementasikan `ICourseRepository`.
  - `CoursesService` tidak perlu diubah.

---

## 7. Mengubah Service untuk Menggunakan Repository

Sekarang, `CoursesService` cukup fokus ke aturan bisnis, dan bergantung pada `ICourseRepository`.

```typescript
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ICourseRepository } from './repositories/course-repository.interface';

@Injectable()
export class CoursesService {
  constructor(
    // Di implementasi nyata, kamu bisa inject via token khusus
    private readonly coursesRepository: ICourseRepository,
  ) {}

  findAll() {
    return this.coursesRepository.findAll();
  }

  async findOne(id: number) {
    const course = await this.coursesRepository.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  create(createCourseDto: CreateCourseDto) {
    return this.coursesRepository.create(createCourseDto);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const updated = await this.coursesRepository.update(id, updateCourseDto);
    if (!updated) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: number) {
    const ok = await this.coursesRepository.remove(id);
    if (!ok) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
  }
}
```

**Penjelasan singkat:**

- `CoursesService` sekarang tidak lagi menyimpan array sendiri – semua akses data lewat `coursesRepository`.
- Service bertugas:
  - Memutuskan kapan harus lempar `NotFoundException`.
  - Menentukan aturan yang terkait bisnis (misal aturan khusus nanti: tidak boleh hapus course tertentu, dsb.).

> Di implementasi Nest yang lebih “production-ready”, kamu biasanya akan:
>
> - Menggunakan **injection token** (misal `COURSE_REPOSITORY`) dan `@Inject(COURSE_REPOSITORY)` untuk injeksi interface.
> - Binding-nya diatur di `CoursesModule` (`providers: [{ provide: COURSE_REPOSITORY, useClass: InMemoryCourseRepository }]`).
>
> Untuk step ini, fokus utamanya adalah **memisahkan peran Service vs Repository** terlebih dahulu.

---

## 8. Integrasi di Module (Gambaran)

Secara konsep, di `CoursesModule` akan ada semacam:

```typescript
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { InMemoryCourseRepository } from './repositories/in-memory-course.repository';

@Module({
  controllers: [CoursesController],
  providers: [
    CoursesService,
    {
      provide: 'COURSE_REPOSITORY',
      useClass: InMemoryCourseRepository,
    },
  ],
})
export class CoursesModule {}
```

Dan di `CoursesService` kamu inject dengan:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository } from './repositories/course-repository.interface';

@Injectable()
export class CoursesService {
  constructor(
    @Inject('COURSE_REPOSITORY')
    private readonly coursesRepository: ICourseRepository,
  ) {}

  // ...
}
```

Di step Prisma nanti, kamu cukup:

- Membuat `PrismaCourseRepository` yang juga mengimplementasikan `ICourseRepository`.
- Mengganti `useClass` dari `InMemoryCourseRepository` menjadi `PrismaCourseRepository`.

---

## 9. Tugas Mandiri (Wajib)

1. **Ekstrak logic array dari `CoursesService` ke repository**  
   - Buat interface `ICourseRepository` dan implementasi `InMemoryCourseRepository` seperti konsep di atas.
   - Pastikan semua operasi (findAll, findOne, create, update, remove) berjalan lewat repository.

2. **Refactor `CoursesService`**  
   - Hilangkan array in-memory dari `CoursesService`.
   - Pastikan service hanya memanggil method di `ICourseRepository`.

3. **Pastikan semua endpoint masih berfungsi**  
   - `GET /courses`
   - `GET /courses/:id`
   - `POST /courses`
   - `PATCH /courses/:id`
   - `DELETE /courses/:id`

4. **Catatan `notes-step-03-repository.md`**  
   Jawab pertanyaan:
   - Menurutmu, apa perbedaan tanggung jawab Service dan Repository setelah refactor ini?
   - Bayangkan nanti kita pakai Prisma: bagian mana yang perlu diubah, dan bagian mana yang bisa tetap sama?

---

## 10. Checklist Penilaian

Kamu dianggap **lulus Step 03 (Advanced Repository Pattern)** jika:

- [ ] `ICourseRepository` sudah didefinisikan dengan jelas.
- [ ] Ada implementasi repository (misalnya `InMemoryCourseRepository`) yang memindahkan logic array dari service.
- [ ] `CoursesService` sudah tidak menyimpan array sendiri dan hanya memakai repository.
- [ ] Semua endpoint Course masih berfungsi seperti sebelumnya (tidak ada perubahan perilaku bagi client).
- [ ] `notes-step-03-repository.md` berisi refleksi singkatmu tentang perubahan arsitektur ini.

---

## 11. Tantangan Tambahan (Opsional)

- **Tantangan 1 – Tambah method khusus di repository**  
  Buat method baru `findByTitle(keyword: string)` di `ICourseRepository` dan implementasinya di `InMemoryCourseRepository`.  
  Update service + controller untuk menyediakan endpoint `GET /courses/search?title=...`.

- **Tantangan 2 – Dummy Prisma Repository (Desain)**  
  Tanpa meng-install Prisma dulu, coba desain (di atas kertas / pseudo code) seperti apa `PrismaCourseRepository` yang mengimplementasikan `ICourseRepository`.

- **Tantangan 3 – Unit Test Sederhana**  
  Buat unit test untuk `CoursesService` dengan cara **mock** `ICourseRepository` (misalnya pakai Jest), sehingga kamu bisa menguji business logic tanpa harus menyalakan server atau menyentuh data nyata.

