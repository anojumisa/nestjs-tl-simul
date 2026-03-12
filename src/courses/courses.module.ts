import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
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
