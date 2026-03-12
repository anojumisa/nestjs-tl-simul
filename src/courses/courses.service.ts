import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

export interface Course {
  id: number;
  title: string;
  description: string;
}

@Injectable()
export class CoursesService {
  private courses: Course[] = [];
  private nextId = 1;

  findAll(): Course[] {
    return this.courses;
  }

  findOne(id: number): Course {
    const course = this.courses.find((c) => c.id === id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  create(createCourseDto: CreateCourseDto): Course {
    const newCourse: Course = {
      id: this.nextId++,
      title: createCourseDto.title,
      description: createCourseDto.description,
    };

    this.courses.push(newCourse);
    return newCourse;
  }

  update(id: number, updateCourseDto: UpdateCourseDto): Course {
    const course = this.findOne(id);

    if (typeof updateCourseDto.title === 'string') {
      course.title = updateCourseDto.title;
    }
    if (typeof updateCourseDto.description === 'string') {
      course.description = updateCourseDto.description;
    }

    return course;
  }

  remove(id: number): void {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    this.courses.splice(index, 1);
  }
}
