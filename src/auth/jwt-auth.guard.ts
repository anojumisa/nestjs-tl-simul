import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Memanggil Passport strategy bernama `jwt` (lihat `JwtStrategy`). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
