import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository } from './repositories/course-repository.interface';

@Injectable()
export class CoursesService {
  constructor(
    @Inject('COURSE_REPOSITORY')
    private readonly coursesRepository: ICourseRepository,
  ) {}

  findAll() {
    return this.coursesRepository.findAll();
  }
}
