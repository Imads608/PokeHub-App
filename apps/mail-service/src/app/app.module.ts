import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration]
})],
  controllers: [],
  providers: [],
})
export class AppModule {}
