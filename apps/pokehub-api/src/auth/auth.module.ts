import { CommonModule } from '../common/common.module';
import { AuthController } from './auth.controller';
import { AuthServiceProvider } from './auth.service';
import { Module } from '@nestjs/common';
import { UsersDBModule } from '@pokehub/backend/pokehub-users-db';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';

@Module({
  imports: [CommonModule, SharedAuthUtilsModule, UsersDBModule],
  controllers: [AuthController],
  providers: [AuthServiceProvider],
})
export class AuthModule {}
