import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WrapResponseInterceptor } from './common/interceptors/wrap-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    .setDescription('Dokumentasi API untuk Learning Platform')
    .setVersion('1.0')
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
