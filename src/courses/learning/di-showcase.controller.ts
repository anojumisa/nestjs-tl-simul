import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

function resolveRepositoryBinding(): {
  envRaw: string | undefined;
  activeRepository: 'InMemoryCourseRepository' | 'DemoSeedCourseRepository';
} {
  const normalized = process.env.COURSE_REPOSITORY_IMPL?.toLowerCase().trim();
  const activeRepository =
    normalized === 'demo-seed'
      ? 'DemoSeedCourseRepository'
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
          'Kosong atau selain demo-seed → InMemoryCourseRepository. Nilai demo-seed → DemoSeedCourseRepository.',
      },
      activeBinding: {
        implementationClass: activeRepository,
        compareGetCourses:
          activeRepository === 'DemoSeedCourseRepository'
            ? 'Response berisi judul berawalan [Showcase DI] (id 201–202).'
            : 'Response berisi data dummy standar (id 1–2 + data yang kamu buat lewat POST).',
      },
      codePaths: {
        serviceWithInjection: 'src/courses/courses.service.ts',
        moduleWiring: 'src/courses/courses.module.ts',
        withoutDiIllustration: 'src/courses/learning/courses.service.without-di.example.ts',
        alternativeRepository: 'src/courses/learning/demo-seed-course.repository.ts',
      },
      demoSteps: [
        'Baca courses.service.ts vs learning/courses.service.without-di.example.ts (polusi `new`).',
        'GET /learning/di lalu GET /courses — catat isi data.',
        'Stop server; jalankan: COURSE_REPOSITORY_IMPL=demo-seed pnpm run start:dev',
        'GET /courses lagi — CoursesService sama, data dari repository demo.',
      ],
    };
  }
}
