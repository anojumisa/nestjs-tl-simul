import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { InMemoryCourseRepository } from './repositories/in-memory-course.repository';
import { DemoSeedCourseRepository } from './learning/demo-seed-course.repository';
import { PostgresCourseRepository } from './repositories/postgres-course.repository';
import { DiShowcaseController } from './learning/di-showcase.controller';
import { requestIdMiddleware } from '../common/middleware/request-id.middleware';
import { loggerMiddleware } from '../common/middleware/logger.middleware';
import { rateLimitMiddleware } from '../common/middleware/rate-limit.middleware';
import { Pool } from 'pg';

@Module({
  controllers: [CoursesController, DiShowcaseController],
  providers: [
    CoursesService,
    {
      provide: 'COURSE_REPOSITORY',
      useFactory: () => {
        const impl = process.env.COURSE_REPOSITORY_IMPL?.toLowerCase().trim();
        if (impl === 'demo-seed') {
          return new DemoSeedCourseRepository();
        }

        // Sebelum Step 14: selain `demo-seed`, default selalu `InMemoryCourseRepository`.
        // Sekarang kita mulai "bergerak" ke integrasi PostgreSQL:
        // - Jika `COURSE_REPOSITORY_IMPL=postgres`, gunakan `PostgresCourseRepository`.
        // - Jika environment belum siap / tidak match, fallback ke in-memory.
        if (impl === 'postgres') {
          const databaseUrl = process.env.DATABASE_URL;

          const pool =
            databaseUrl && databaseUrl.length > 0
              ? new Pool({ connectionString: databaseUrl })
              : new Pool({
                  host: process.env.PGHOST,
                  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
                  user: process.env.PGUSER,
                  password: process.env.PGPASSWORD,
                  database: process.env.PGDATABASE,
                });

          if (
            !databaseUrl &&
            (!process.env.PGHOST ||
              !process.env.PGUSER ||
              !process.env.PGDATABASE)
          ) {
            throw new Error(
              'Postgres config tidak ditemukan. Set `DATABASE_URL` atau gunakan `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.',
            );
          }

          return new PostgresCourseRepository(pool);
        }

        /**
         * Sebelum Step 14 (yang lama):
         * - default provider selalu `InMemoryCourseRepository`
         *
         * Sekarang (yang baru):
         * - masih tetap fallback ke in-memory untuk safety net
         * - tetapi jika `COURSE_REPOSITORY_IMPL=postgres`, kita pindah ke `PostgresCourseRepository`.
         */
        // return new InMemoryCourseRepository();
        return new InMemoryCourseRepository();
      },
    },
  ],
})
export class CoursesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(requestIdMiddleware, loggerMiddleware, rateLimitMiddleware)
      .forRoutes({ path: 'courses', method: RequestMethod.ALL });
  }
}
