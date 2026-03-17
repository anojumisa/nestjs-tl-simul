import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'Fundamental NestJS untuk Pemula (Updated)',
    description: 'Judul course (opsional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Judul minimal 3 karakter' })
  @MaxLength(100, { message: 'Judul maksimal 100 karakter' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Deskripsi course yang diperbarui.',
    description: 'Deskripsi course (opsional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Deskripsi minimal 10 karakter' })
  @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
  description?: string;
}
