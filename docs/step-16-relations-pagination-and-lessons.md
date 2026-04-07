# Step 16 - Relasi Prisma, pagination, dan endpoint Lesson

## 1. Tujuan Belajar

Setelah step ini kamu diharapkan:

- Memodelkan relasi **one-to-many** (`Course` → `Lesson`) di `schema.prisma` dan memahami **cascade delete**.
- Menjalankan **pagination**, **sorting**, dan **filter** pada daftar course (query string) — baik di Prisma maupun di raw SQL.
- Menyusun endpoint nested REST: `GET/POST/DELETE` di bawah `courses/:courseId/lessons`.
- Memahami kapan memakai **`$transaction`** Prisma (seed contoh di `prisma/seed.ts`).
- Menjaga kontrak **repository** (`ICourseRepository`) sehingga `CoursesService` tetap menjadi pusat orkestrasi.

---

## 2. Kenapa relasi `Lesson`?

Di Step 15 satu `Course` masih berdiri sendiri. Di domain nyata, course punya **modul/lesson** terpisah yang bisa ditambah atau dihapus tanpa mengganti judul course.

Di database, kita menyimpan lesson di tabel **`lessons`** dengan foreign key **`course_id`** ke **`courses.id`**.  
Dengan `onDelete: Cascade` pada sisi Prisma, menghapus course akan ikut menghapus lesson anak — konsisten dan aman dari orphan rows.

---

## 3. Skema Prisma (ringkas)

Lihat `prisma/schema.prisma`:

- Model **`Course`** memiliki relasi `lessons Lesson[]`.
- Model **`Lesson`** memiliki `courseId`, `title`, `sortOrder`, dan relasi balik ke `Course`.

`sortOrder` dipakai untuk urutan tampil (bukan mengandalkan `id` saja).

---

## 4. Perubahan bentuk response `GET /courses`

Sebelumnya (Step 14–15), interceptor membungkus **array** course di `data`.

Sekarang `data` berisi objek:

```json
{
  "items": [ { "id": 1, "title": "...", "description": "..." } ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

- Tanpa `page` dan `limit` di query string, repository mengembalikan **semua baris yang cocok filter**; field `limit` pada response diisi panjang hasil (minimal 1).
- Dengan `page` **atau** `limit`, pagination aktif (`limit` dibatasi maks. 100).

Query yang didukung (lihat Swagger `GET /courses`):

| Query | Fungsi |
|--------|--------|
| `page` | Nomor halaman (≥ 1) |
| `limit` | Ukuran halaman (1–100) |
| `sort` | `id` atau `title` |
| `order` | `asc` atau `desc` |
| `q` | Substring pada `title` (case-insensitive di Prisma / ILIKE di PostgreSQL) |

---

## 5. Endpoint lesson

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/courses/:id?includeLessons=true` | Satu course; optional embed `lessons[]` |
| GET | `/courses/:courseId/lessons` | Hanya daftar lesson (404 jika course tidak ada) |
| POST | `/courses/:courseId/lessons` | Body: `title`, opsional `sortOrder` |
| DELETE | `/courses/:courseId/lessons/:lessonId` | Hapus lesson milik course tersebut |

Semua response sukses tetap melalui **WrapResponseInterceptor** (`success`, `data`, `meta`).

---

## 6. Implementasi per repository

| Implementasi | Catatan |
|--------------|---------|
| **PrismaCourseRepository** | `include`, `skip`/`take`, `count`, filter `contains` mode `insensitive` |
| **PostgresCourseRepository** | SQL parameterized; pastikan migration `lessons` sudah dijalankan (`docs/sql/migrations/step-16-0003_create_lessons_table.sql` atau Prisma migrate) |
| **InMemory** / **DemoSeed** | Data lesson di memori untuk demo tanpa database |

---

## 7. Transaksi di seed

File `prisma/seed.ts` memakai `prisma.$transaction` untuk menjalankan beberapa operasi sebagai satu unit: menghapus data lalu membuat course beserta lesson nested.  
Ini mencegah keadaan “course sudah ada tapi lesson gagal insert” tanpa rollback.

---

## 8. Checklist penilaian

- [ ] Bisa menjelaskan one-to-many dan dampak `ON DELETE CASCADE`.
- [ ] Bisa membaca query `GET /courses?page=1&limit=5&q=nest&sort=title&order=asc`.
- [ ] Bisa mendemokan `includeLessons` vs endpoint `/lessons` terpisah.
- [ ] Bisa menjalankan migration + seed setelah pull perubahan schema.

---

## 9. Next Step (preview)

- **Step 17** — pola relasi Prisma lengkap (1:1, 1:N, N:1, N:M) + blueprint many-to-many `Enrollment`:
  - `docs/step-17-prisma-relationship-patterns.md`
  - `docs/step-17-commands-and-verification.md`
- Soft delete dan audit field.
- Policy authorization per course/lesson (RBAC).
