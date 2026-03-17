import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<any>();

    const method = req?.method;
    const url = req?.originalUrl ?? req?.url;
    const requestId = req?.requestId;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        const prefix = requestId ? `[requestId=${requestId}] ` : '';
        console.log(`${prefix}[${method}] ${url} (${durationMs}ms)`);
      }),
    );
  }
}
