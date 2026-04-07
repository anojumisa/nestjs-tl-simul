import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

function resolveRepositoryBinding(): {
  envRaw: string | undefined;
  activeRepository:
    | 'InMemoryCourseRepository'
    | 'DemoSeedCourseRepository'
    | 'PostgresCourseRepository'
    | 'PrismaCourseRepository';
} {
  const normalized = process.env.COURSE_REPOSITORY_IMPL?.toLowerCase().trim();
  const activeRepository =
    normalized === 'demo-seed'
      ? 'DemoSeedCourseRepository'
      : normalized === 'prisma'
        ? 'PrismaCourseRepository'
      : normalized === 'postgres'
        ? 'PostgresCourseRepository'
        : 'InMemoryCourseRepository';

  return {
    envRaw: process.env.COURSE_REPOSITORY_IMPL,
    activeRepository,
  };
}

/**
 * Endpoint ringan untuk demo DI ke mahasiswa (tidak mempengaruhi logika CRUD selain info binding).
 */
@ApiTags('learning')
@Controller('learning')
export class DiShowcaseController {
  @Get('di')
  @ApiOperation({
    summary:
      'Showcase Dependency Injection — binding aktif & petunjuk membandingkan kode',
  })
  getShowcase() {
    const { envRaw, activeRepository } = resolveRepositoryBinding();

    return {
      topic: 'Dependency Injection — contoh terintegrasi di repo ini',
      summary:
        'CoursesService di src/courses/courses.service.ts tidak diubah saat kita mengganti penyimpanan: yang berubah hanya provider di CoursesModule (lihat useFactory + env).',
      environment: {
        variable: 'COURSE_REPOSITORY_IMPL',
        currentValue: envRaw ?? null,
        notes:
          'Kosong/selain demo-seed/postgres/prisma → InMemoryCourseRepository. Nilai demo-seed → DemoSeedCourseRepository. Nilai postgres → PostgresCourseRepository. Nilai prisma → PrismaCourseRepository.',
      },
      activeBinding: {
        implementationClass: activeRepository,
        compareGetCourses:
          activeRepository === 'DemoSeedCourseRepository'
            ? 'GET /courses mengembalikan objek berisi `items`, `total`, `page`, `limit` (judul demo id 201–202).'
            : activeRepository === 'PrismaCourseRepository'
              ? 'GET /courses mengembalikan metadata + `items` dari tabel `courses` via Prisma; lesson di `GET /courses/:id?includeLessons=true` atau `/courses/:id/lessons`.'
            : activeRepository === 'PostgresCourseRepository'
              ? 'GET /courses mengembalikan metadata + `items` dari PostgreSQL (raw SQL); lesson memerlukan tabel `lessons` — lihat Step 16.'
              : 'GET /courses mengembalikan metadata + `items` (in-memory: id 1–2 + data dari POST).',
      },
      codePaths: {
        serviceWithInjection: 'src/courses/courses.service.ts',
        moduleWiring: 'src/courses/courses.module.ts',
        withoutDiIllustration:
          'src/courses/learning/courses.service.without-di.example.ts',
        alternativeRepository:
          'src/courses/learning/demo-seed-course.repository.ts',
      },
      demoSteps: [
        'Baca courses.service.ts vs learning/courses.service.without-di.example.ts (polusi `new`).',
        'GET /learning/di lalu GET /courses — catat isi data.',
        'Stop server; jalankan: COURSE_REPOSITORY_IMPL=demo-seed pnpm run start:dev',
        'GET /courses lagi — CoursesService sama, data dari repository demo.',
        'Stop server; jalankan: COURSE_REPOSITORY_IMPL=postgres pnpm run start:dev',
        'Pastikan DB sudah siap (migrations + seed), lalu GET /courses untuk melihat data dari PostgreSQL.',
        'Stop server; jalankan: COURSE_REPOSITORY_IMPL=prisma pnpm run start:dev',
        'Jalankan Prisma migrate + seed, lalu GET /courses untuk melihat data via Prisma ORM.',
        'Untuk Step 17 relasi lanjut: coba POST /learning/relations/one-to-one/users dan GET /learning/relations/many-to-many/students/:studentId.',
      ],
    };
  }
}
