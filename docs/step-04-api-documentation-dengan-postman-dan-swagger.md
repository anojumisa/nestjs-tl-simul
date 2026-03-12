# Step 04 – API Documentation dengan Postman & Swagger

## 1. Tujuan Belajar

Setelah menyelesaikan step ini kamu diharapkan:

- **Memahami** pentingnya dokumentasi API dalam pengembangan backend.
- **Mampu menggunakan** Postman Collection sebagai bentuk dokumentasi yang bisa dieksekusi.
- **Mampu menyiapkan** dokumentasi otomatis dengan Swagger di NestJS.
- **Mengetahui** cara membaca dan mencoba endpoint lewat Swagger UI.

---

## 2. Kenapa Dokumentasi API Penting?

Tanpa dokumentasi:

- Frontend / client tidak tahu endpoint apa saja yang tersedia.
- Cara kirim request (method, URL, body, header) jadi tebak-tebakan.
- Di tim, orang baru akan sulit memahami API yang sudah ada.

Dengan dokumentasi:

- Semua orang punya **satu sumber kebenaran** untuk spesifikasi API.
- Komunikasi antara backend–frontend jadi lebih jelas.
- Mempermudah testing manual dan otomatis.

Dalam step ini kita fokus ke dua tools:

- **Postman** (atau Thunder Client/Insomnia) – dokumentasi berbentuk *collection* request yang bisa langsung dieksekusi.
- **Swagger (OpenAPI)** – dokumentasi otomatis yang digenerate oleh NestJS, bisa diakses lewat web UI.

---

## 3. Dokumentasi dengan Postman Collection

### 3.1. Konsep Koleksi (Collection)

Di Postman, kita bisa membuat:

- **Collection**: kumpulan request (misal: seluruh endpoint untuk fitur Course).
- **Environment**: kumpulan variable (misal: `base_url`, `token`).

Keuntungannya:

- Kamu bisa menyimpan semua request API yang sudah dibuat di Step 02–03 di satu tempat.
- Tinggal share 1 file **collection JSON** ke teman/mentor.

### 3.2. Menyusun Collection untuk Course

Buat collection baru, misalnya:

- Nama: `Learning Platform API – Courses`

Di dalamnya, buat request-request berikut:

1. **Get all courses**
   - Method: `GET`
   - URL: `{{base_url}}/courses`
   - Tidak perlu body.

2. **Get course by id**
   - Method: `GET`
   - URL: `{{base_url}}/courses/1` (atau id lain yang sudah dibuat).

3. **Create course**
   - Method: `POST`
   - URL: `{{base_url}}/courses`
   - Headers:
     - `Content-Type: application/json`
   - Body (raw JSON), contoh:
     ```json
     {
       "title": "Fundamental NestJS untuk Pemula",
       "description": "Kelas pengantar untuk memahami dasar NestJS."
     }
     ```

4. (Opsional) **Update course**
   - Method: `PATCH`
   - URL: `{{base_url}}/courses/1`
   - Body (raw JSON), contoh:
     ```json
     {
       "title": "Fundamental NestJS (Updated)"
     }
     ```

5. (Opsional) **Delete course**
   - Method: `DELETE`
   - URL: `{{base_url}}/courses/1`

### 3.3. Menggunakan Environment Variable

Agar lebih fleksibel, buat environment Postman:

- Nama environment: `Localhost`
- Variable:
  - `base_url` → `http://localhost:3000`

Dengan ini, jika nanti base URL berubah (misal ke staging/prod), kamu cukup ganti `base_url` tanpa mengedit semua request.

### 3.4. Export & Share Collection

Setelah selesai:

1. Klik kanan pada collection → **Export**.
2. Pilih format (misalnya `Collection v2.1`).
3. Simpan file `Learning Platform API – Courses.postman_collection.json`.

File ini bisa:

- Dijadikan bagian dari repo (misal di folder `postman/`).
- Diimport oleh teman/mentor untuk mencoba API yang sama.

---

## 4. Dokumentasi Otomatis dengan Swagger (OpenAPI)

Selain Postman, NestJS punya integrasi resmi dengan **Swagger** untuk:

- Menghasilkan spesifikasi **OpenAPI** dari kode (bisa diexport sebagai JSON/YAML).
- Menyajikan **UI interaktif** di browser untuk melihat daftar endpoint dan mencoba request langsung dari browser.

Dengan Swagger, orang lain bisa:

- Melihat semua endpoint yang tersedia (method, path).
- Melihat bentuk request body, query param, dan response.
- Menjalankan request tanpa perlu buka Postman.

---

### 4.1. Instal Dependency Swagger

Di project NestJS kamu, install:

```bash
pnpm add @nestjs/swagger swagger-ui-express
# atau
npm install @nestjs/swagger swagger-ui-express
# atau
yarn add @nestjs/swagger swagger-ui-express
```

Pastikan command disesuaikan dengan package manager yang dipakai di project.

### 4.2. Mengaktifkan Swagger di main.ts

Buka src/main.ts dan tambahkan setup Swagger.

Contoh pola (konsep):


```bash
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Learning Platform API')
    .setDescription('Dokumentasi API untuk Learning Platform')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
  console.log('Learning Platform API – NestJS running on http://localhost:3000');
  console.log('Swagger docs available at http://localhost:3000/docs');
}
bootstrap();
```

Penjelasan singkat:

- DocumentBuilder() dipakai untuk mengisi metadata API:
  - setTitle → judul API.
  - setDescription → deskripsi singkat.
  - setVersion → versi API.
  - Nanti bisa ditambah addBearerAuth() untuk auth.

- SwaggerModule.createDocument(app, config):
  - Meng-generate objek spesifikasi OpenAPI berdasarkan:
    - konfigurasi config,
    - dekorator Swagger di controller/DTO.
  - SwaggerModule.setup('docs', app, document):
    - Mendaftarkan route /docs yang menampilkan Swagger UI.

Setelah ini:

- Jalankan app → buka http://localhost:3000/docs.
- Kamu akan melihat daftar endpoint yang sudah dikenali oleh Swagger.

### 4.3. Menambah Dekorator di Controller & DTO

Agar dokumentasi Swagger lebih informatif, kita bisa menambahkan dekorator di:

- Controller (level endpoint).
- DTO (level field/properti).

#### 4.3.1. Dekorator di Controller

Contoh di CoursesController:

```bash
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Ambil semua course' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil satu course berdasarkan id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat course baru' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course berdasarkan id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus course berdasarkan id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
```

Penjelasan:

- @ApiTags('courses'):
  - Mengelompokkan semua endpoint controller ini dalam satu group bernama courses di Swagger UI.
- @ApiOperation({ summary: '...' }):
  - Menambahkan deskripsi singkat per endpoint (akan muncul di Swagger UI).

#### 4.3.2. Dekorator di DTO

Contoh di CreateCourseDto:

```bash
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Fundamental NestJS untuk Pemula',
    description: 'Judul course yang akan ditampilkan ke user',
  })
  title: string;

  @ApiProperty({
    example: 'Kelas pengantar untuk memahami dasar NestJS.',
    description: 'Deskripsi singkat mengenai isi course',
  })
  description: string;
}
```

Penjelasan:

- @ApiProperty:
  - Memberikan metadata ke Swagger tentang:
    - contoh nilai (example),
    - penjelasan field (description),
    - tipe data (akan dibaca dari TypeScript).
- Hasilnya:
  - Di Swagger UI, saat melihat schema CreateCourseDto, kamu akan melihat contoh nilai dan penjelasan yang membantu.

Kalau kamu punya UpdateCourseDto, kamu bisa menambahkan @ApiProperty({ required: false, ... }) untuk menandakan field opsional.