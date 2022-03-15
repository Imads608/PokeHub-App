import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from '@pokehub/common/logger';
import { AUTH_SERVICE } from './auth-service.interface';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { MAIL_SERVICE } from './mail-service.interface';
import { MailService } from './mail.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AuthMicroservice',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          name: 'AuthMicroservice',
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('authService.host'),
            port: +configService.get<number>('authService.port'),
          },
        }),
      },
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
      }
    ]),
    LoggerModule,
    HttpModule
  ],
  providers: [{ useClass: AuthService, provide: AUTH_SERVICE }, { useClass: MailService, provide: MAIL_SERVICE }, AuthGuard],
  exports: [
    { useClass: AuthService, provide: AUTH_SERVICE },
    { useClass: MailService, provide: MAIL_SERVICE },
    AuthGuard,
    LoggerModule,
    HttpModule
  ],
})
export class CommonModule {}
