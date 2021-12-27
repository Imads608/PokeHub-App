import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../common/common.module';
import { MAIL_SERVICE } from './mail-service.interface';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    CommonModule,
    ClientsModule.registerAsync([
      {
        name: 'MailMicroservice',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          name: 'MailMicroservice',
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('mailService.host'),
            port: +configService.get<number>('mailService.port'),
          },
        }),
      },
    ]),
  ],
  providers: [{ useClass: MailService, provide: MAIL_SERVICE }],
  exports: [{ useClass: MailService, provide: MAIL_SERVICE }],
  controllers: [MailController],
})
export class MailModule {}
