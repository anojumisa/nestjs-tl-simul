import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Menandai handler membutuhkan salah satu role berikut (dipakai bersama `RolesGuard`). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
