import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserService } from './user.service';
import { USER_SERVICE } from './user-service.interface';
import { UserController } from './user.controller';

@Module({
  imports: [CommonModule, ClientsModule.registerAsync([
    {
      name: 'UserInternalService',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: 'UserInternalService',
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('userService.host'),
          port: +configService.get<number>('userService.port'),
        },
      }),
    }])],
  controllers: [UserController],
  providers: [{ useClass: UserService, provide: USER_SERVICE }]
})
export class UserModule {}
