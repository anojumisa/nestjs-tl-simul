import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';
import { RefreshTokenDto } from './dto/refresh-token.dto';

type RefreshPayload = {
  sub: number;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private getAuthPolicy() {
    const maxFailedLoginsRaw = this.config.get<string>('AUTH_MAX_FAILED_LOGINS', '5');
    const lockMinutesRaw = this.config.get<string>('AUTH_LOCK_MINUTES', '15');
    return {
      maxFailedLogins: Number.parseInt(maxFailedLoginsRaw, 10) || 5,
      lockMinutes: Number.parseInt(lockMinutesRaw, 10) || 15,
      refreshExpiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      refreshSecret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    };
  }

  private async signAccessToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload);
  }

  private async signRefreshToken(userId: number) {
    const { refreshExpiresIn, refreshSecret } = this.getAuthPolicy();
    return this.jwt.signAsync(
      { sub: userId, type: 'refresh' } satisfies RefreshPayload,
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as `${number}d`,
      },
    );
  }

  private async persistRefreshToken(userId: number, refreshToken: string) {
    const { refreshExpiresIn } = this.getAuthPolicy();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const now = new Date();
    const expiresInDays = Number.parseInt(refreshExpiresIn.replace('d', ''), 10);
    const refreshTokenExpiresAt = Number.isNaN(expiresInDays)
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        refreshTokenExpiresAt,
      },
    });
  }

  private async registerFailedAttempt(userId: number, currentCount: number) {
    const { maxFailedLogins, lockMinutes } = this.getAuthPolicy();
    const nextCount = currentCount + 1;
    const shouldLock = nextCount >= maxFailedLogins;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: nextCount,
        lockUntil: shouldLock
          ? new Date(Date.now() + lockMinutes * 60 * 1000)
          : null,
      },
    });
  }

  private async clearFailedAttempts(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Account temporarily locked due to repeated failed login attempts',
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await this.registerFailedAttempt(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await this.clearFailedAttempts(user.id);
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.signAccessToken(payload);
    const refresh_token = await this.signRefreshToken(user.id);
    await this.persistRefreshToken(user.id, refresh_token);
    return {
      access_token,
      refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const { refreshSecret } = this.getAuthPolicy();

    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh session not found');
    }
    if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const matches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token reuse detected or invalid');
    }

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.signAccessToken(accessPayload);
    const refresh_token = await this.signRefreshToken(user.id);
    await this.persistRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
