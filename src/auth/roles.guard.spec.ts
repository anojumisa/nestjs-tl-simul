import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(reflectorMock as unknown as Reflector);
  });

  const makeContext = (role?: string): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow when no roles metadata exists', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined);

    const canActivate = guard.canActivate(makeContext('student'));

    expect(canActivate).toBe(true);
  });

  it('should allow when user role matches required role', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['admin']);

    const canActivate = guard.canActivate(makeContext('admin'));

    expect(canActivate).toBe(true);
  });

  it('should throw ForbiddenException when role mismatch', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['admin']);

    expect(() => guard.canActivate(makeContext('student'))).toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException when user is missing', () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['admin']);

    expect(() => guard.canActivate(makeContext())).toThrow(ForbiddenException);
  });
});
