import { AuthModule } from '../auth/auth.module';
import type { Routes } from '@nestjs/core';

export const routes: Routes = [
  {
    path: '/auth',
    module: AuthModule,
  },
];
