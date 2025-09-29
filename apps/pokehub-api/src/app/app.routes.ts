import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import type { Routes } from '@nestjs/core';

export const routes: Routes = [
  {
    path: '/auth',
    module: AuthModule,
  },
  { path: '/users', module: UsersModule },
];
