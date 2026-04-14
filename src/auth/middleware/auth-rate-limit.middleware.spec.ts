import type { NextFunction, Request, Response } from 'express';
import { authRateLimitMiddleware } from './auth-rate-limit.middleware';

describe('authRateLimitMiddleware', () => {
  const makeResponse = () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    return { res, headers };
  };

  it('should call next for initial requests within the limit', () => {
    const req = {
      ip: '127.0.0.1',
      method: 'POST',
      path: `/auth/login-${Date.now()}`,
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;
    const { res } = makeResponse();
    const next = jest.fn() as NextFunction;

    authRateLimitMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((res as any).status).not.toHaveBeenCalled();
  });

  it('should return 429 after exceeding request limit for same key', () => {
    const req = {
      ip: '127.0.0.1',
      method: 'POST',
      path: `/auth/refresh-${Date.now()}`,
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;
    const { res, headers } = makeResponse();
    const next = jest.fn() as NextFunction;

    for (let i = 0; i < 11; i += 1) {
      authRateLimitMiddleware(req, res, next);
    }

    expect((res as any).status).toHaveBeenCalledWith(429);
    expect((res as any).json).toHaveBeenCalled();
    expect(headers['X-Auth-RateLimit-Limit']).toBe('10');
    expect(headers['X-Auth-RateLimit-Remaining']).toBe('0');
  });
});
