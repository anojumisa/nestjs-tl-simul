import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICourseRepository } from './repositories/course-repository.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import type { CourseListQuery } from './repositories/course-repository.interface';

@Injectable()
export class CoursesService {
  constructor(
    // Service depends on abstraction (`ICourseRepository`), not concrete DB technology.
    // This is why we can switch implementation (in-memory, raw SQL, Prisma) from module wiring.
    @Inject('COURSE_REPOSITORY')
    private readonly coursesRepository: ICourseRepository,
  ) {}

  findAll(query?: CourseListQuery) {
    return this.coursesRepository.findAll(query);
  }

  async findOne(id: number, includeLessons?: boolean) {
    const course = await this.coursesRepository.findOne(id, {
      includeLessons: !!includeLessons,
    });
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

  async findLessonsForCourse(courseId: number) {
    await this.findOne(courseId);
    return this.coursesRepository.findLessonsByCourseId(courseId);
  }

  async addLesson(courseId: number, dto: CreateLessonDto) {
    const lesson = await this.coursesRepository.createLesson(courseId, {
      title: dto.title,
      sortOrder: dto.sortOrder ?? 0,
    });
    if (!lesson) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    return lesson;
  }

  async removeLesson(courseId: number, lessonId: number) {
    await this.findOne(courseId);
    const ok = await this.coursesRepository.removeLesson(courseId, lessonId);
    if (!ok) {
      throw new NotFoundException(
        `Lesson with id ${lessonId} not found for course ${courseId}`,
      );
    }
    return {
      message: `Lesson with id ${lessonId} deleted for course ${courseId}`,
    };
  }
}
