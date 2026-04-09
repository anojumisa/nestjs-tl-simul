import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token dari response login/refresh sebelumnya',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  refreshToken: string;
}
