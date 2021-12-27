import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CommonModule } from '../common/common.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatCommonModule } from '../chat/common/chat-common.module';
import { USER_SERVICE } from './user-service.interface';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    CommonModule,
    ChatCommonModule,
    MailModule,
    ClientsModule.registerAsync([
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
    ]),
  ],
  providers: [{ useClass: UserService, provide: USER_SERVICE }],
  controllers: [UserController],
})
export class UserModule {}
