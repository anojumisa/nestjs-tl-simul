import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICourseRepository } from './repositories/course-repository.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @Inject('COURSE_REPOSITORY')
    private readonly coursesRepository: ICourseRepository,
  ) {}

  findAll() {
    return this.coursesRepository.findAll();
  }

  async findOne(id: number) {
    const course = await this.coursesRepository.findOne(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  create(createCourseDto: CreateCourseDto) {
    return this.coursesRepository.create({
      title: createCourseDto.title,
      description: createCourseDto.description,
    });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const updated = await this.coursesRepository.update(id, {
      title: updateCourseDto.title,
      description: updateCourseDto.description,
    });
    if (!updated) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: number) {
    const ok = await this.coursesRepository.remove(id);
    if (!ok) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return { message: `Course with id ${id} deleted` };
  }
}
