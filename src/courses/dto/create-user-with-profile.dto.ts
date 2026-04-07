import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUserWithProfileDto {
  @ApiProperty({ example: 'mentor@learning.local' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: 'Mentor Prisma' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiPropertyOptional({ example: 'Bio singkat mentor.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
