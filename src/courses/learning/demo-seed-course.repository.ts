import { Injectable } from '@nestjs/common';
import { CourseModel, ICourseRepository } from '../repositories/course-repository.interface';

/**
 * Implementasi `ICourseRepository` kedua untuk demo DI:
 * `CoursesService` tidak diubah — hanya binding `COURSE_REPOSITORY` di module.
 *
 * Jalankan aplikasi dengan `COURSE_REPOSITORY_IMPL=demo-seed` lalu bandingkan `GET /courses`.
 */
@Injectable()
export class DemoSeedCourseRepository implements ICourseRepository {
  private courses: CourseModel[] = [
    {
      id: 201,
      title: '[Showcase DI] Sumber: demo-seed repository',
      description:
        'Data ini berasal dari DemoSeedCourseRepository, bukan InMemoryCourseRepository.',
    },
    {
      id: 202,
      title: '[Showcase DI] Kelas CoursesService tetap sama',
      description:
        'Provider diganti lewat CoursesModule + env — lihat GET /learning/di.',
    },
  ];

  private nextId = 203;

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
