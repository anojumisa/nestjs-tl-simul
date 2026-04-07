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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';

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
  @ApiOperation({ summary: 'Buat course baru' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course berdasarkan id' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus course berdasarkan id' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
