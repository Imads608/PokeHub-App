import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../common/common.module';
import { GoogleOauthController } from './google-oauth.controller';

@Module({
  imports: [CommonModule, ClientsModule.registerAsync([
    {
      name: 'UserMicroservice',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: 'UserMicroservice',
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('userService.host'),
          port: +configService.get<number>('userService.port'),
        },
      }),
    },
  ])],
  controllers: [GoogleOauthController],
})
export class GoogleOauthModule {}
