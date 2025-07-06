import { CommonModule } from '../common/common.module';
import { UsersController } from './users.controller';
import { UsersServiceProvider } from './users.service.provider';
import { Module } from '@nestjs/common';
import { UsersDBModule } from '@pokehub/backend/pokehub-users-db';

@Module({
  imports: [CommonModule, UsersDBModule],
  controllers: [UsersController],
  providers: [UsersServiceProvider],
})
export class UsersModule {}
