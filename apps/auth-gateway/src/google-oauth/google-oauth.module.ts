import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../common/common.module';
import { GoogleOauthController } from './google-oauth.controller';

@Module({
  imports: [CommonModule, ClientsModule.registerAsync([
    {
      name: 'UserTCPGateway',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: 'UserTCPGateway',
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('userTCPGateway.host'),
          port: +configService.get<number>('userTCPGateway.port'),
        },
      }),
    },
  ])],
  controllers: [GoogleOauthController],
})
export class GoogleOauthModule {}
