import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthServiceProvider } from './auth.service';
import { Module } from '@nestjs/common';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';

@Module({
  imports: [CommonModule, SharedAuthUtilsModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthServiceProvider],
})
export class AuthModule {}
