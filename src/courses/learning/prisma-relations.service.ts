import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserWithProfileDto } from '../dto/create-user-with-profile.dto';
import { EnrollStudentDto } from '../dto/enroll-student.dto';

@Injectable()
export class PrismaRelationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserWithProfile(dto: CreateUserWithProfileDto) {
    const plain = dto.password ?? 'RelationsDemo123!';
    const passwordHash = await bcrypt.hash(plain, 10);

    // 1:1 (User <-> UserProfile) via nested create in one Prisma call.
    // SQL equivalent (inside a transaction):
    // INSERT INTO users (email) VALUES ($1) RETURNING id;
    // INSERT INTO user_profiles (user_id, full_name, bio) VALUES ($2, $3, $4);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'student',
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
    // Prisma `include` eagerly loads relation data.
    // SQL equivalent:
    // SELECT u.id, u.email, p.id, p.full_name, p.bio
    // FROM users u
    // LEFT JOIN user_profiles p ON p.user_id = u.id
    // WHERE u.id = $1;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  async enrollStudent(dto: EnrollStudentDto) {
    // Validate foreign keys explicitly for clearer error messages.
    // (Database FK will also enforce this at insert time.)
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
      // N:M via explicit join table `Enrollment`.
      // SQL equivalent:
      // INSERT INTO enrollments (student_id, course_id)
      // VALUES ($1, $2);
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
        // P2002 = unique constraint violation (our composite key already exists).
        throw new ConflictException('Student already enrolled in this course');
      }
      throw error;
    }
  }

  async getStudentWithCourses(studentId: number) {
    // Fetch one student + all enrolled courses through join table.
    // SQL equivalent:
    // SELECT s.*, e.enrolled_at, c.*
    // FROM students s
    // LEFT JOIN enrollments e ON e.student_id = s.id
    // LEFT JOIN courses c ON c.id = e.course_id
    // WHERE s.id = $1
    // ORDER BY e.enrolled_at ASC;
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
    // Inverse read of the same N:M relation:
    // one course with all enrolled students.
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
