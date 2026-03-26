import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { InMemoryCourseRepository } from './repositories/in-memory-course.repository';
import { DemoSeedCourseRepository } from './learning/demo-seed-course.repository';
import { DiShowcaseController } from './learning/di-showcase.controller';
import { requestIdMiddleware } from '../common/middleware/request-id.middleware';
import { loggerMiddleware } from '../common/middleware/logger.middleware';
import { rateLimitMiddleware } from '../common/middleware/rate-limit.middleware';

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
