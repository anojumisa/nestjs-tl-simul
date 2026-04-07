import { Injectable } from '@nestjs/common';
import {
  CourseListQuery,
  CourseListResult,
  CourseModel,
  ICourseRepository,
  LessonModel,
} from './course-repository.interface';

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
  private lessons: LessonModel[] = [
    {
      id: 1,
      courseId: 1,
      title: 'Pengenalan NestJS & arsitektur modul',
      sortOrder: 1,
    },
    {
      id: 2,
      courseId: 1,
      title: 'Controller, route, dan HTTP method',
      sortOrder: 2,
    },
    {
      id: 3,
      courseId: 2,
      title: 'Generics & utility types',
      sortOrder: 1,
    },
  ];
  private nextId = 3;
  private nextLessonId = 4;

  private cloneCourse(c: CourseModel): CourseModel {
    return { ...c, lessons: c.lessons?.map((l) => ({ ...l })) };
  }

  private applyListQuery(courses: CourseModel[], query?: CourseListQuery): CourseModel[] {
    let list = courses.map((c) => ({ ...c }));

    const q = query?.q?.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }

    const sort = query?.sort === 'title' ? 'title' : 'id';
    const order = query?.order === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      const av = sort === 'title' ? a.title : a.id;
      const bv = sort === 'title' ? b.title : b.id;
      if (av < bv) return -1 * order;
      if (av > bv) return 1 * order;
      return 0;
    });

    return list;
  }

  async findAll(query?: CourseListQuery): Promise<CourseListResult> {
    const usePaging = query?.page != null || query?.limit != null;
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));

    const filtered = this.applyListQuery(this.courses, query);
    const total = filtered.length;

    let items: CourseModel[];
    if (usePaging) {
      const skip = (page - 1) * limit;
      items = filtered.slice(skip, skip + limit).map((c) => this.cloneCourse(c));
    } else {
      items = filtered.map((c) => this.cloneCourse(c));
    }

    return {
      items,
      total,
      page: usePaging ? page : 1,
      limit: usePaging ? limit : Math.max(items.length, 1),
    };
  }

  async findOne(
    id: number,
    options?: { includeLessons?: boolean },
  ): Promise<CourseModel | null> {
    const course = this.courses.find((c) => c.id === id);
    if (!course) return null;

    const copy = this.cloneCourse(course);
    if (options?.includeLessons) {
      copy.lessons = this.lessons
        .filter((l) => l.courseId === id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        .map((l) => ({ ...l }));
    }
    return copy;
  }

  async create(data: Omit<CourseModel, 'id' | 'lessons'>): Promise<CourseModel> {
    const newCourse: CourseModel = {
      id: this.nextId++,
      title: data.title,
      description: data.description,
    };
    this.courses.push(newCourse);
    return this.cloneCourse(newCourse);
  }

  async update(
    id: number,
    data: Partial<Omit<CourseModel, 'id' | 'lessons'>>,
  ): Promise<CourseModel | null> {
    const existing = this.courses.find((c) => c.id === id);
    if (!existing) return null;

    if (typeof data.title === 'string') existing.title = data.title;
    if (typeof data.description === 'string')
      existing.description = data.description;

    return this.cloneCourse(existing);
  }

  async remove(id: number): Promise<boolean> {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.courses.splice(index, 1);
    this.lessons = this.lessons.filter((l) => l.courseId !== id);
    return true;
  }

  async findLessonsByCourseId(courseId: number): Promise<LessonModel[]> {
    return this.lessons
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((l) => ({ ...l }));
  }

  async createLesson(
    courseId: number,
    data: Pick<LessonModel, 'title' | 'sortOrder'>,
  ): Promise<LessonModel | null> {
    const course = this.courses.find((c) => c.id === courseId);
    if (!course) return null;

    const row: LessonModel = {
      id: this.nextLessonId++,
      courseId,
      title: data.title,
      sortOrder: data.sortOrder,
    };
    this.lessons.push(row);
    return { ...row };
  }

  async removeLesson(courseId: number, lessonId: number): Promise<boolean> {
    const idx = this.lessons.findIndex(
      (l) => l.id === lessonId && l.courseId === courseId,
    );
    if (idx === -1) return false;
    this.lessons.splice(idx, 1);
    return true;
  }
}
