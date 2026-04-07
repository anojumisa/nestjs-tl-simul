import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CourseListQuery,
  CourseListResult,
  CourseModel,
  ICourseRepository,
  LessonModel,
} from './course-repository.interface';

@Injectable()
export class PrismaCourseRepository implements ICourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toCourseModel(c: {
    id: number;
    title: string;
    description: string;
  }): CourseModel {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
    };
  }

  async findAll(query?: CourseListQuery): Promise<CourseListResult> {
    const usePaging = query?.page != null || query?.limit != null;
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const sortField = query?.sort === 'title' ? 'title' : 'id';
    const order = query?.order === 'desc' ? 'desc' : 'asc';

    const q = query?.q?.trim();
    const where: Prisma.CourseWhereInput | undefined = q
      ? { title: { contains: q, mode: 'insensitive' } }
      : undefined;

    const total = await this.prisma.course.count({ where });

    const rows = await this.prisma.course.findMany({
      where,
      orderBy: { [sortField]: order },
      ...(usePaging ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    const items = rows.map((c) => this.toCourseModel(c));

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
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: options?.includeLessons
        ? { lessons: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] } }
        : undefined,
    });

    if (!course) return null;

    const base = this.toCourseModel(course);
    if (options?.includeLessons && 'lessons' in course) {
      const lessons = (
        course as {
          lessons: {
            id: number;
            courseId: number;
            title: string;
            sortOrder: number;
          }[];
        }
      ).lessons;
      base.lessons = lessons.map((l) => ({
        id: l.id,
        courseId: l.courseId,
        title: l.title,
        sortOrder: l.sortOrder,
      }));
    }
    return base;
  }

  async create(data: Omit<CourseModel, 'id' | 'lessons'>): Promise<CourseModel> {
    const created = await this.prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
      },
    });

    return this.toCourseModel(created);
  }

  async update(
    id: number,
    data: Partial<Omit<CourseModel, 'id' | 'lessons'>>,
  ): Promise<CourseModel | null> {
    const existing = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!existing) return null;

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...(typeof data.title === 'string' ? { title: data.title } : {}),
        ...(typeof data.description === 'string'
          ? { description: data.description }
          : {}),
      },
    });

    return this.toCourseModel(updated);
  }

  async remove(id: number): Promise<boolean> {
    const existing = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.course.delete({
      where: { id },
    });

    return true;
  }

  async findLessonsByCourseId(courseId: number): Promise<LessonModel[]> {
    const rows = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map((l) => ({
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      sortOrder: l.sortOrder,
    }));
  }

  async createLesson(
    courseId: number,
    data: Pick<LessonModel, 'title' | 'sortOrder'>,
  ): Promise<LessonModel | null> {
    const exists = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!exists) return null;

    const row = await this.prisma.lesson.create({
      data: {
        courseId,
        title: data.title,
        sortOrder: data.sortOrder,
      },
    });

    return {
      id: row.id,
      courseId: row.courseId,
      title: row.title,
      sortOrder: row.sortOrder,
    };
  }

  async removeLesson(courseId: number, lessonId: number): Promise<boolean> {
    const result = await this.prisma.lesson.deleteMany({
      where: { id: lessonId, courseId },
    });
    return result.count > 0;
  }
}
