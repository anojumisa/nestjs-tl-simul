import type { NextFunction, Request, Response } from 'express';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const LIMIT = 30;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const key = `${ip}:${req.method}:${req.path}`;

  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  current.count += 1;
  store.set(key, current);

  const remaining = Math.max(0, LIMIT - current.count);
  res.setHeader('X-RateLimit-Limit', String(LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(current.resetAt));

  if (current.count > LIMIT) {
    return res.status(429).json({
      success: false,
      error: {
        statusCode: 429,
        message: 'Too Many Requests',
      },
      meta: {
        limit: LIMIT,
        windowMs: WINDOW_MS,
        resetAt: current.resetAt,
      },
    });
  }

  return next();
}

