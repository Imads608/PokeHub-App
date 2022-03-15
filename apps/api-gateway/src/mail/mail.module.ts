import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { MailController } from './mail.controller';

@Module({
  imports: [
    CommonModule,
    UserModule
  ],
  providers: [],
  exports: [],
  controllers: [MailController],
})
export class MailModule {}
