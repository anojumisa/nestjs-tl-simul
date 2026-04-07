import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { CourseListQuery } from '../repositories/course-repository.interface';

export class ListCoursesQueryDto implements CourseListQuery {
  @ApiPropertyOptional({ minimum: 1, description: 'Nomor halaman (aktif jika `limit` juga dipakai).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, description: 'Ukuran halaman.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['id', 'title'] })
  @IsOptional()
  @IsIn(['id', 'title'])
  sort?: 'id' | 'title';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Filter substring pada judul (case-insensitive).' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  q?: string;
}
