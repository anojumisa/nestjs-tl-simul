import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({
    summary: 'Ambil daftar course (pagination & filter opsional)',
    description:
      'Tanpa `page`/`limit`, semua baris yang cocok dikembalikan (dengan metadata `total`).',
  })
  findAll(@Query() query: ListCoursesQueryDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil satu course berdasarkan id' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeLessons', new DefaultValuePipe(false), ParseBoolPipe)
    includeLessons: boolean,
  ) {
    return this.coursesService.findOne(id, includeLessons);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buat course baru' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update course berdasarkan id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hapus course berdasarkan id (hanya role admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
