import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthTokensDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login — mengembalikan access token + refresh token',
    description:
      'Jika kredensial valid, endpoint mengembalikan access token untuk Authorization header dan refresh token untuk rotasi sesi.',
  })
  @ApiOkResponse({
    description: 'Login berhasil',
    type: AuthTokensDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Email/password salah atau akun sedang terkunci sementara akibat terlalu banyak gagal login.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit auth terlampaui. Tunggu hingga window reset.',
  })
  @ApiResponse({
    status: 401,
    description: 'Contoh response 401 Unauthorized',
    content: {
      'application/json': {
        example: {
          success: false,
          error: {
            statusCode: 401,
            message: 'Invalid email or password',
          },
          meta: {
            timestamp: '2026-04-09T10:00:00.000Z',
            path: '/auth/login',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Contoh response 429 Too Many Requests',
    content: {
      'application/json': {
        example: {
          success: false,
          error: {
            statusCode: 429,
            message: 'Too Many Authentication Requests',
          },
          meta: {
            limit: 10,
            windowMs: 60000,
            resetAt: 1760000000000,
          },
        },
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh token — rotasi refresh token dan terbitkan access token baru',
    description:
      'Kirim refresh token dari login/refresh sebelumnya. Jika valid, server merotasi refresh token dan mengeluarkan pasangan token baru.',
  })
  @ApiOkResponse({
    description: 'Refresh berhasil dan token baru diterbitkan',
    type: AuthTokensDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token invalid, expired, atau tidak cocok dengan sesi aktif.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit auth terlampaui. Tunggu hingga window reset.',
  })
  @ApiResponse({
    status: 401,
    description: 'Contoh response 401 Unauthorized pada refresh',
    content: {
      'application/json': {
        example: {
          success: false,
          error: {
            statusCode: 401,
            message: 'Invalid refresh token',
          },
          meta: {
            timestamp: '2026-04-09T10:00:00.000Z',
            path: '/auth/refresh',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Contoh response 429 Too Many Requests pada refresh',
    content: {
      'application/json': {
        example: {
          success: false,
          error: {
            statusCode: 429,
            message: 'Too Many Authentication Requests',
          },
          meta: {
            limit: 10,
            windowMs: 60000,
            resetAt: 1760000000000,
          },
        },
      },
    },
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }
}
