import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configMock = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        AUTH_MAX_FAILED_LOGINS: '5',
        AUTH_LOCK_MINUTES: '15',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return values[key] ?? defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_SECRET') return 'access-secret';
      throw new Error(`Missing key ${key}`);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login should return access and refresh tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'mentor@learning.local',
      passwordHash: 'hashed-password',
      role: 'admin',
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
    jwtMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('refresh-token-hash' as never);
    prismaMock.user.update.mockResolvedValue({ id: 1 });

    const result = await service.login({
      email: 'mentor@learning.local',
      password: 'MentorDemo123',
    });

    expect(result.access_token).toBe('access-token');
    expect(result.refresh_token).toBe('refresh-token');
    expect(result.user).toEqual({
      id: 1,
      email: 'mentor@learning.local',
      role: 'admin',
    });
    expect(jwtMock.signAsync).toHaveBeenCalledTimes(2);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('validateUser should throw when password invalid and increment failed attempts', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'student@learning.local',
      passwordHash: 'hash',
      role: 'student',
      failedLoginAttempts: 2,
      lockUntil: null,
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);
    prismaMock.user.update.mockResolvedValue({ id: 7 });

    await expect(
      service.validateUser('student@learning.local', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        failedLoginAttempts: 3,
        lockUntil: null,
      },
    });
  });

  it('validateUser should reject when account is locked', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 9,
      email: 'locked@learning.local',
      passwordHash: 'hash',
      role: 'student',
      failedLoginAttempts: 5,
      lockUntil: new Date(Date.now() + 60_000),
    });
    const compareSpy = jest.spyOn(bcrypt, 'compare');

    await expect(
      service.validateUser('locked@learning.local', 'any'),
    ).rejects.toThrow(UnauthorizedException);

    expect(compareSpy).not.toHaveBeenCalled();
  });

  it('refresh should rotate tokens for valid refresh token', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      type: 'refresh',
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'mentor@learning.local',
      role: 'admin',
      refreshTokenHash: 'stored-refresh-hash',
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
    jwtMock.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('new-refresh-hash' as never);
    prismaMock.user.update.mockResolvedValue({ id: 1 });

    const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('new-refresh-token');
    expect(jwtMock.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
      secret: 'refresh-secret',
    });
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('refresh should throw for invalid refresh token', async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(
      service.refresh({ refreshToken: 'invalid-refresh-token' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
