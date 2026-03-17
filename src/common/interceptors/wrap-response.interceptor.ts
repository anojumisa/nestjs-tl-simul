import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<any>();

    return next.handle().pipe(
      map((data) => {
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: req?.originalUrl ?? req?.url,
            requestId: req?.requestId,
          },
        };
      }),
    );
  }
}

