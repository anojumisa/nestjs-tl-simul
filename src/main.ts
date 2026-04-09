import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WrapResponseInterceptor } from './common/interceptors/wrap-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Basic security headers for browser-facing surfaces (`/docs`) and API responses.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProd) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
    );
    next();
  });

  // DTO + Pipes (Validation)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Interceptors (success response wrapper + logging)
  app.useGlobalInterceptors(new LoggingInterceptor(), new WrapResponseInterceptor());

  // Exception Filters (error response wrapper)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger (API docs)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Learning Platform API')
    .setDescription(
      'Dokumentasi API untuk Learning Platform. Auth flow: POST /auth/login untuk mendapatkan access+refresh token, lalu POST /auth/refresh untuk rotasi token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT dari POST /auth/login (tempel token tanpa kata Bearer)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    'Learning Platform API - NestJS running on http://localhost:3000',
  );
  console.log('Swagger docs available at http://localhost:3000/docs');
}
bootstrap();
