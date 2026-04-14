import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RefreshTokenDto } from './refresh-token.dto';

describe('RefreshTokenDto validation', () => {
  it('should pass for valid refresh token', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refreshToken: 'this-is-a-long-enough-refresh-token',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail when refresh token is too short', async () => {
    const dto = plainToInstance(RefreshTokenDto, {
      refreshToken: 'short-token',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((err) => err.property === 'refreshToken')).toBe(true);
  });

  it('should fail when refresh token is missing', async () => {
    const dto = plainToInstance(RefreshTokenDto, {});

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((err) => err.property === 'refreshToken')).toBe(true);
  });
});
