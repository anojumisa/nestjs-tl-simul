import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto validation', () => {
  it('should pass for valid payload', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'mentor@learning.local',
      password: 'MentorDemo123',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail for invalid email', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'invalid-email',
      password: 'MentorDemo123',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((err) => err.property === 'email')).toBe(true);
  });

  it('should fail for short password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'mentor@learning.local',
      password: 'short',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((err) => err.property === 'password')).toBe(true);
  });
});
