import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const configMock = {
    getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('validate should return user when payload is valid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'mentor@learning.local',
      role: 'admin',
    });

    const result = await strategy.validate({
      sub: 1,
      email: 'mentor@learning.local',
      role: 'admin',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, email: true, role: true },
    });
    expect(result).toEqual({
      id: 1,
      email: 'mentor@learning.local',
      role: 'admin',
    });
  });

  it('validate should throw UnauthorizedException when user missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 999, email: 'missing@learning.local', role: 'student' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
