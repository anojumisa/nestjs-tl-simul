import { Injectable } from '@nestjs/common';
import { CourseModel, ICourseRepository } from './course-repository.interface';

@Injectable()
export class InMemoryCourseRepository implements ICourseRepository {
  private courses: CourseModel[] = [
    {
      id: 1,
      title: 'Fundamental NestJS untuk Pemula',
      description: 'Kelas pengantar untuk memahami dasar NestJS dan REST API.',
    },
    {
      id: 2,
      title: 'TypeScript Lanjutan untuk Backend',
      description:
        'Membahas tipe lanjutan dan praktik terbaik TypeScript di server.',
    },
  ];
  private nextId = 3;

  async findAll(): Promise<CourseModel[]> {
    return this.courses;
  }

  async findOne(id: number): Promise<CourseModel | null> {
    const course = this.courses.find((c) => c.id === id);
    return course ?? null;
  }

  async create(data: Omit<CourseModel, 'id'>): Promise<CourseModel> {
    const newCourse: CourseModel = {
      id: this.nextId++,
      title: data.title,
      description: data.description,
    };
    this.courses.push(newCourse);
    return newCourse;
  }

  async update(
    id: number,
    data: Partial<Omit<CourseModel, 'id'>>,
  ): Promise<CourseModel | null> {
    const existing = this.courses.find((c) => c.id === id);
    if (!existing) return null;

    if (typeof data.title === 'string') existing.title = data.title;
    if (typeof data.description === 'string')
      existing.description = data.description;

    return existing;
  }

  async remove(id: number): Promise<boolean> {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.courses.splice(index, 1);
    return true;
  }
}
