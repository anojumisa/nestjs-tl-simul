import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoursesModule } from './courses/courses.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Loads .env into process.env (local dev) and supports real env vars in production.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
