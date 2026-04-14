import { Body, Controller, INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { LoginDto } from './dto/login.dto';

@Controller('test-auth-validation')
class TestAuthValidationController {
  @Post('login')
  login(@Body() dto: LoginDto) {
    return dto;
  }
}

describe('Auth ValidationPipe (integration-style)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestAuthValidationController],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should reject invalid payload with 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/test-auth-validation/login')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should reject extra fields when forbidNonWhitelisted is true', async () => {
    await request(app.getHttpServer())
      .post('/test-auth-validation/login')
      .send({
        email: 'mentor@learning.local',
        password: 'MentorDemo123',
        unexpected: 'not-allowed',
      })
      .expect(400);
  });

  it('should accept valid payload and return DTO values', async () => {
    const response = await request(app.getHttpServer())
      .post('/test-auth-validation/login')
      .send({
        email: 'mentor@learning.local',
        password: 'MentorDemo123',
      })
      .expect(201);

    expect(response.body).toEqual({
      email: 'mentor@learning.local',
      password: 'MentorDemo123',
    });
  });
});
