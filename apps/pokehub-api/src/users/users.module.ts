import { CommonModule } from '../common/common.module';
import { UsersController } from './users.controller';
import { UsersServiceProvider } from './users.service.provider';
import { Module } from '@nestjs/common';
import { UsersDBModule } from '@pokehub/backend/pokehub-users-db';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';

@Module({
  imports: [CommonModule, SharedAuthUtilsModule, UsersDBModule],
  controllers: [UsersController],
  providers: [UsersServiceProvider],
})
export class UsersModule {}
