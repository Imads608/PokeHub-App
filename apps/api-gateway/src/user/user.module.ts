import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CommonModule } from '../common/common.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatCommonModule } from '../chat/common/chat-common.module';

@Module({
  imports: [
    CommonModule, ChatCommonModule,
    ClientsModule.registerAsync([
        {
            name: 'UserMicroservice',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: 'UserMicroservice',
                transport: Transport.TCP,
                options: {
                    host: 'localhost',
                    port: +configService.get<Number>('USER_MICROSERVICE_PORT')
                }
            })

        }
    ])
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
