import type { NextFunction, Request, Response } from 'express';
import type { RequestWithId } from './request-id.middleware';

export function loggerMiddleware(
  req: Request & Partial<RequestWithId>,
  res: Response,
  next: NextFunction,
) {
  const { method } = req;
  const url = (req as any).originalUrl ?? (req as any).url;
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const requestId = (req as any).requestId;
    const prefix = requestId ? `[requestId=${requestId}] ` : '';
    console.log(`${prefix}[${method}] ${url} → ${res.statusCode} (${durationMs}ms)`);
  });

  next();
}

