import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserWithProfileDto } from '../dto/create-user-with-profile.dto';
import { EnrollStudentDto } from '../dto/enroll-student.dto';

@Injectable()
export class PrismaRelationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserWithProfile(dto: CreateUserWithProfileDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        profile: {
          create: {
            fullName: dto.fullName,
            bio: dto.bio,
          },
        },
      },
      include: { profile: true },
    });
  }

  async getUserWithProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  async enrollStudent(dto: EnrollStudentDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException(`Student with id ${dto.studentId} not found`);
    }

    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException(`Course with id ${dto.courseId} not found`);
    }

    try {
      return await this.prisma.enrollment.create({
        data: {
          studentId: dto.studentId,
          courseId: dto.courseId,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Student already enrolled in this course');
      }
      throw error;
    }
  }

  async getStudentWithCourses(studentId: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: { course: true },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }
    return student;
  }

  async getCourseWithStudents(courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: { student: true },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    return course;
  }
}
