import { AuthModule } from '../auth/auth.module';
import { TeamsModule } from '../teams/teams.module';
import { TestModule } from '../test/test.module';
import { UsersModule } from '../users/users.module';
import type { Routes } from '@nestjs/core';

export const routes: Routes = [
  {
    path: '/auth',
    module: AuthModule,
  },
  { path: '/users', module: UsersModule },
  { path: '/teams', module: TeamsModule },
  { path: '/test', module: TestModule },
];
