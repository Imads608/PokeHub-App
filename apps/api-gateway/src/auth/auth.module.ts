import { Module } from '@nestjs/common';
import { ChatCommonModule } from '../chat/common/chat-common.module';
import { CommonModule } from '../common/common.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [CommonModule, ChatCommonModule],
  controllers: [AuthController],
  providers: [GoogleStrategy],
})
export class AuthModule {}
