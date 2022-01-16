import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@pokehub/common/logger';
import { MAIL_SERVICE } from './mail-service.interface';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>(`smtpConfig.host`),
          port: 465,
          secure: 'true',
          auth: {
            user: configService.get<string>(`smtpConfig.username`),
            pass: configService.get<string>('smtpConfig.password'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('smtpConfig.email')}>`,
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new PugAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    LoggerModule,
  ],
  providers: [{ useClass: MailService, provide: MAIL_SERVICE }],
  controllers: [MailController],
})
export class MailModule {}
