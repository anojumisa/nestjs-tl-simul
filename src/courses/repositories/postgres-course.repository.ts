import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { CourseModel, ICourseRepository } from './course-repository.interface';

@Injectable()
export class PostgresCourseRepository implements ICourseRepository, OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  async onModuleDestroy() {
    // Close pool gracefully on shutdown to avoid hanging processes.
    await this.pool.end();
  }

  async findAll(): Promise<CourseModel[]> {
    const result = await this.pool.query<{
      id: number;
      title: string;
      description: string;
    }>(
      `
      SELECT id, title, description
      FROM courses
      ORDER BY id ASC
      `,
    );

    return result.rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description,
    }));
  }

  async findOne(id: number): Promise<CourseModel | null> {
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

    return {
      id: Number(row.id),
      title: row.title,
      description: row.description,
    };
  }

  async create(data: Omit<CourseModel, 'id'>): Promise<CourseModel> {
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

    const row = result.rows[0];
    if (!row) {
      // In normal cases RETURNING should always give a row.
      throw new Error('Failed to create course (no row returned).');
    }

    return {
      id: Number(row.id),
      title: row.title,
      description: row.description,
    };
  }

  async update(
    id: number,
    data: Partial<Omit<CourseModel, 'id'>>,
  ): Promise<CourseModel | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    // Build a safe dynamic UPDATE: only set fields that are provided.
    if (typeof data.title === 'string') {
      values.push(data.title);
      setClauses.push(`title = $${values.length}`);
    }

    if (typeof data.description === 'string') {
      values.push(data.description);
      setClauses.push(`description = $${values.length}`);
    }

    // No-op: nothing to update.
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

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: Number(row.id),
      title: row.title,
      description: row.description,
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
}
