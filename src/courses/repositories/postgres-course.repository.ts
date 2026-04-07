import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  CourseListQuery,
  CourseListResult,
  CourseModel,
  ICourseRepository,
  LessonModel,
} from './course-repository.interface';

@Injectable()
export class PostgresCourseRepository implements ICourseRepository, OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
  }

  async findAll(query?: CourseListQuery): Promise<CourseListResult> {
    const usePaging = query?.page != null || query?.limit != null;
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const sortCol = query?.sort === 'title' ? 'title' : 'id';
    const order = query?.order === 'desc' ? 'DESC' : 'ASC';
    const q = query?.q?.trim();

    const whereClause = q
      ? `WHERE title ILIKE $1`
      : '';
    const countParams = q ? [`%${q}%`] : [];

    const countSql = `
      SELECT COUNT(*)::int AS c
      FROM courses
      ${whereClause}
    `;
    const countResult = await this.pool.query<{ c: number }>(countSql, countParams);
    const total = countResult.rows[0]?.c ?? 0;

    const dataParams: unknown[] = [...countParams];
    let pagingClause = '';
    if (usePaging) {
      const offset = (page - 1) * limit;
      const limitParamIndex = dataParams.length + 1;
      dataParams.push(limit, offset);
      pagingClause = `LIMIT $${limitParamIndex} OFFSET $${limitParamIndex + 1}`;
    }

    const dataSql = `
      SELECT id, title, description
      FROM courses
      ${whereClause}
      ORDER BY ${sortCol} ${order}
      ${pagingClause}
    `;

    const result = await this.pool.query<{
      id: number;
      title: string;
      description: string;
    }>(dataSql, dataParams);

    const items = result.rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description,
    }));

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
    const result = await this.pool.query<{
      id: number;
      title: string;
      description: string;
    }>(
      `
      SELECT id, title, description
      FROM courses
      WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];
    if (!row) return null;

    const course: CourseModel = {
      id: Number(row.id),
      title: row.title,
      description: row.description,
    };

    if (options?.includeLessons) {
      course.lessons = await this.findLessonsByCourseId(id);
    }

    return course;
  }

  async create(data: Omit<CourseModel, 'id' | 'lessons'>): Promise<CourseModel> {
    const result = await this.pool.query<{
      id: number;
      title: string;
      description: string;
    }>(
      `
      INSERT INTO courses (title, description)
      VALUES ($1, $2)
      RETURNING id, title, description
      `,
      [data.title, data.description],
    );

    const r = result.rows[0];
    if (!r) {
      throw new Error('Failed to create course (no row returned).');
    }

    return {
      id: Number(r.id),
      title: r.title,
      description: r.description,
    };
  }

  async update(
    id: number,
    data: Partial<Omit<CourseModel, 'id' | 'lessons'>>,
  ): Promise<CourseModel | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (typeof data.title === 'string') {
      values.push(data.title);
      setClauses.push(`title = $${values.length}`);
    }

    if (typeof data.description === 'string') {
      values.push(data.description);
      setClauses.push(`description = $${values.length}`);
    }

    if (setClauses.length === 0) return this.findOne(id);

    values.push(id);
    const whereParam = values.length;

    const result = await this.pool.query<{
      id: number;
      title: string;
      description: string;
    }>(
      `
      UPDATE courses
      SET
        ${setClauses.join(', ')},
        updated_at = NOW()
      WHERE id = $${whereParam}
      RETURNING id, title, description
      `,
      values,
    );

    const r = result.rows[0];
    if (!r) return null;

    return {
      id: Number(r.id),
      title: r.title,
      description: r.description,
    };
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pool.query<{ id: number }>(
      `
      DELETE FROM courses
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    return result.rows.length > 0;
  }

  async findLessonsByCourseId(courseId: number): Promise<LessonModel[]> {
    const result = await this.pool.query<{
      id: number;
      course_id: number;
      title: string;
      sort_order: number;
    }>(
      `
      SELECT id, course_id, title, sort_order
      FROM lessons
      WHERE course_id = $1
      ORDER BY sort_order ASC, id ASC
      `,
      [courseId],
    );

    return result.rows.map((r) => ({
      id: Number(r.id),
      courseId: Number(r.course_id),
      title: r.title,
      sortOrder: Number(r.sort_order),
    }));
  }

  async createLesson(
    courseId: number,
    data: Pick<LessonModel, 'title' | 'sortOrder'>,
  ): Promise<LessonModel | null> {
    const check = await this.pool.query<{ id: number }>(
      `SELECT id FROM courses WHERE id = $1`,
      [courseId],
    );
    if (check.rows.length === 0) return null;

    const result = await this.pool.query<{
      id: number;
      course_id: number;
      title: string;
      sort_order: number;
    }>(
      `
      INSERT INTO lessons (course_id, title, sort_order)
      VALUES ($1, $2, $3)
      RETURNING id, course_id, title, sort_order
      `,
      [courseId, data.title, data.sortOrder],
    );

    const r = result.rows[0];
    if (!r) return null;

    return {
      id: Number(r.id),
      courseId: Number(r.course_id),
      title: r.title,
      sortOrder: Number(r.sort_order),
    };
  }

  async removeLesson(courseId: number, lessonId: number): Promise<boolean> {
    const result = await this.pool.query<{ id: number }>(
      `
      DELETE FROM lessons
      WHERE id = $1 AND course_id = $2
      RETURNING id
      `,
      [lessonId, courseId],
    );

    return result.rows.length > 0;
  }
}
