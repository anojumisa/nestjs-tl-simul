import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mentor@learning.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MentorDemo123' })
  @IsString()
  @MinLength(8)
  password: string;
}
