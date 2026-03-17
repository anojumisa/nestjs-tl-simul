import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const timestamp = new Date().toISOString();
    const path = request?.originalUrl ?? request?.url;
    const requestId = request?.requestId;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        message = anyRes.message ?? exception.message ?? 'Request error';
        details = anyRes;
      } else {
        message = exception.message ?? 'Request error';
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
    }

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        details,
      },
      meta: {
        timestamp,
        path,
        requestId,
      },
    });
  }
}

