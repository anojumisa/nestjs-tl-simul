import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserWithProfileDto } from '../dto/create-user-with-profile.dto';
import { EnrollStudentDto } from '../dto/enroll-student.dto';
import { PrismaRelationsService } from './prisma-relations.service';

@ApiTags('learning')
@Controller('learning/relations')
export class PrismaRelationsController {
  constructor(private readonly prismaRelationsService: PrismaRelationsService) {}

  @Post('one-to-one/users')
  @ApiOperation({ summary: 'Buat user + profile (contoh relasi one-to-one)' })
  createUserWithProfile(@Body() dto: CreateUserWithProfileDto) {
    return this.prismaRelationsService.createUserWithProfile(dto);
  }

  @Get('one-to-one/users/:userId')
  @ApiOperation({ summary: 'Ambil user + profile (one-to-one include)' })
  getUserWithProfile(@Param('userId', ParseIntPipe) userId: number) {
    return this.prismaRelationsService.getUserWithProfile(userId);
  }

  @Post('many-to-many/enrollments')
  @ApiOperation({
    summary: 'Enroll student ke course (contoh many-to-many explicit join table)',
  })
  enrollStudent(@Body() dto: EnrollStudentDto) {
    return this.prismaRelationsService.enrollStudent(dto);
  }

  @Get('many-to-many/students/:studentId')
  @ApiOperation({ summary: 'Ambil student + courses yang diambil (many-to-many)' })
  getStudentWithCourses(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.prismaRelationsService.getStudentWithCourses(studentId);
  }

  @Get('many-to-many/courses/:courseId')
  @ApiOperation({ summary: 'Ambil course + students yang enroll (many-to-many)' })
  getCourseWithStudents(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.prismaRelationsService.getCourseWithStudents(courseId);
  }
}
