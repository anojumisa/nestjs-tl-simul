import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('courses')
@Controller('courses/:courseId/lessons')
export class CourseLessonsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar lesson untuk satu course' })
  listForCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursesService.findLessonsForCourse(courseId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Tambah lesson pada course' })
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(courseId, dto);
  }

  @Delete(':lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hapus lesson (mengacu pada course)' })
  remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.coursesService.removeLesson(courseId, lessonId);
  }
}
