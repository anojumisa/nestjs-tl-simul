export type CourseId = number;

export interface CourseModel {
  id: CourseId;
  title: string;
  description: string;
}

export interface ICourseRepository {
  findAll(): Promise<CourseModel[]>;
}
