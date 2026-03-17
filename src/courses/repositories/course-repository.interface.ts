export type CourseId = number;

export interface CourseModel {
  id: CourseId;
  title: string;
  description: string;
}

export interface ICourseRepository {
  findAll(): Promise<CourseModel[]>;
  findOne(id: CourseId): Promise<CourseModel | null>;
  create(data: Omit<CourseModel, 'id'>): Promise<CourseModel>;
  update(
    id: CourseId,
    data: Partial<Omit<CourseModel, 'id'>>,
  ): Promise<CourseModel | null>;
  remove(id: CourseId): Promise<boolean>;
}
