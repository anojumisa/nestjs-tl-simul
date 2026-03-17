import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Fundamental NestJS untuk Pemula',
    description: 'Judul course yang akan ditampilkan ke user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Judul course tidak boleh kosong' })
  @MinLength(3, { message: 'Judul minimal 3 karakter' })
  @MaxLength(100, { message: 'Judul maksimal 100 karakter' })
  title: string;

  @ApiProperty({
    example: 'Kelas pengantar untuk memahami dasar NestJS.',
    description: 'Deskripsi singkat mengenai isi course',
  })
  @IsString()
  @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
  @MinLength(10, { message: 'Deskripsi minimal 10 karakter' })
  @MaxLength(500, { message: 'Deskripsi maksimal 500 karakter' })
  description: string;
}
