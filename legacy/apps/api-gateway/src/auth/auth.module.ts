import { Module } from '@nestjs/common';
import { ChatCommonModule } from '../chat/common/chat-common.module';
import { CommonModule } from '../common/common.module';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [CommonModule, ChatCommonModule, MailModule],
  controllers: [AuthController],
  providers: [GoogleStrategy],
})
export class AuthModule {}
