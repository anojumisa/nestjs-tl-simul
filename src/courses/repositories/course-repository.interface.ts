export type CourseId = number;

export interface LessonModel {
  id: number;
  courseId: number;
  title: string;
  sortOrder: number;
}

export interface CourseModel {
  id: CourseId;
  title: string;
  description: string;
  /** Hanya diisi saat `findOne(..., { includeLessons: true })` atau nested response. */
  lessons?: LessonModel[];
}

export type CourseListSortField = 'id' | 'title';

export interface CourseListQuery {
  page?: number;
  limit?: number;
  sort?: CourseListSortField;
  order?: 'asc' | 'desc';
  /** Pencarian substring pada `title` (case-insensitive di PostgreSQL / Prisma). */
  q?: string;
}

export interface CourseListResult {
  items: CourseModel[];
  total: number;
  page: number;
  limit: number;
}

export interface ICourseRepository {
  findAll(query?: CourseListQuery): Promise<CourseListResult>;
  findOne(
    id: CourseId,
    options?: { includeLessons?: boolean },
  ): Promise<CourseModel | null>;
  create(data: Omit<CourseModel, 'id' | 'lessons'>): Promise<CourseModel>;
  update(
    id: CourseId,
    data: Partial<Omit<CourseModel, 'id' | 'lessons'>>,
  ): Promise<CourseModel | null>;
  remove(id: CourseId): Promise<boolean>;

  findLessonsByCourseId(courseId: CourseId): Promise<LessonModel[]>;
  createLesson(
    courseId: CourseId,
    data: Pick<LessonModel, 'title' | 'sortOrder'>,
  ): Promise<LessonModel | null>;
  removeLesson(courseId: CourseId, lessonId: number): Promise<boolean>;
}
