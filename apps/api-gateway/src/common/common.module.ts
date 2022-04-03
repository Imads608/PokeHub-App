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
        name: 'AuthGateway',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          name: 'AuthGateway',
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('authGateway.host'),
            port: +configService.get<number>('authGateway.tcpPort'),
          },
        }),
      },
      {
        name: 'MailGateway',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          name: 'MailGateway',
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('mailGateway.host'),
            port: +configService.get<number>('mailGateway.port'),
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
