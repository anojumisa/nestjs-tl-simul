import { Injectable } from '@nestjs/common';
import {
  CourseListQuery,
  CourseListResult,
  CourseModel,
  ICourseRepository,
  LessonModel,
} from '../repositories/course-repository.interface';

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
  private lessons: LessonModel[] = [];
  private nextLessonId = 1;

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
      items = filtered.slice(skip, skip + limit);
    } else {
      items = filtered;
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
    const copy: CourseModel = { ...course };
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
    return { ...newCourse };
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

    return { ...existing };
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
    if (!this.courses.some((c) => c.id === courseId)) return null;
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
