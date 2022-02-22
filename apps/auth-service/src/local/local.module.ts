import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../common/common.module';
import { LocalEmailStrategy } from './local-email.strategy';
import { LOCAL_SERVICE } from './local-service.interface';
import { LocalUsernameStrategy } from './local-username.strategy';
import { LocalController } from './local.controller';
import { LocalService } from './local.service';

@Module({
  controllers: [LocalController],
  providers: [{ useClass: LocalService, provide: LOCAL_SERVICE }, LocalEmailStrategy, LocalUsernameStrategy],
  imports: [CommonModule, ClientsModule.registerAsync([
    {
      name: 'UserMicroservice',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: 'UserMicroservice',
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('USER_MICROSERVICE_HOST'),
          port: +configService.get<number>('USER_MICROSERVICE_PORT'),
        },
      }),
    },
  ]),]
})
export class LocalModule {}
