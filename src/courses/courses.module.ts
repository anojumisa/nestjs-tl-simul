import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseLessonsController } from './course-lessons.controller';
import { InMemoryCourseRepository } from './repositories/in-memory-course.repository';
import { DemoSeedCourseRepository } from './learning/demo-seed-course.repository';
import { PostgresCourseRepository } from './repositories/postgres-course.repository';
import { PrismaCourseRepository } from './repositories/prisma-course.repository';
import { DiShowcaseController } from './learning/di-showcase.controller';
import { PrismaRelationsController } from './learning/prisma-relations.controller';
import { PrismaRelationsService } from './learning/prisma-relations.service';
import { requestIdMiddleware } from '../common/middleware/request-id.middleware';
import { loggerMiddleware } from '../common/middleware/logger.middleware';
import { rateLimitMiddleware } from '../common/middleware/rate-limit.middleware';
import { Pool } from 'pg';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    CoursesController,
    CourseLessonsController,
    DiShowcaseController,
    PrismaRelationsController,
  ],
  providers: [
    CoursesService,
    PrismaRelationsService,
    {
      provide: 'COURSE_REPOSITORY',
      useFactory: (prismaService: PrismaService) => {
        // This factory is the "switch" students can use to compare storage strategies
        // without changing controller/service business logic.
        const impl = process.env.COURSE_REPOSITORY_IMPL?.toLowerCase().trim();
        if (impl === 'demo-seed') {
          return new DemoSeedCourseRepository();
        }

        if (impl === 'prisma') {
          return new PrismaCourseRepository(prismaService);
        }

        // Setelah Step 14 + Step 15:
        // - `postgres` -> PostgresCourseRepository (raw SQL)
        // - `prisma`   -> PrismaCourseRepository (ORM Prisma)
        // - lainnya    -> fallback in-memory
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
         * - jika `COURSE_REPOSITORY_IMPL=postgres`, pindah ke `PostgresCourseRepository`
         * - jika `COURSE_REPOSITORY_IMPL=prisma`, pindah ke `PrismaCourseRepository`.
         */
        // return new InMemoryCourseRepository();
        return new InMemoryCourseRepository();
      },
      inject: [PrismaService],
    },
  ],
})
export class CoursesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(requestIdMiddleware, loggerMiddleware, rateLimitMiddleware)
      .forRoutes(CoursesController, CourseLessonsController);
  }
}
