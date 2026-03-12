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

  findAll(): Promise<CourseModel[]> {
    return Promise.resolve(this.courses);
  }
}
