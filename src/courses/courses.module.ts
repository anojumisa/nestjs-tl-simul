import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { InMemoryCourseRepository } from './repositories/in-memory-course.repository';
import { requestIdMiddleware } from '../common/middleware/request-id.middleware';
import { loggerMiddleware } from '../common/middleware/logger.middleware';
import { rateLimitMiddleware } from '../common/middleware/rate-limit.middleware';

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
export class CoursesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(requestIdMiddleware, loggerMiddleware, rateLimitMiddleware)
      .forRoutes({ path: 'courses', method: RequestMethod.ALL });
  }
}
