import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'mentor@learning.local' })
  email: string;

  @ApiProperty({ example: 'admin' })
  role: string;
}

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR...' })
  access_token: string;

  @ApiProperty({
    description: 'JWT refresh token (dipakai untuk POST /auth/refresh)',
    example: 'eyJhbGciOiJIUzI1NiIsInR...',
  })
  refresh_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
