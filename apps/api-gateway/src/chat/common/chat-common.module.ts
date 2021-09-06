/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DirectMessageService } from './direct-message.service';
import { RoomService } from './room.service';

@Module({
    imports: [ClientsModule.registerAsync([
        {
            name: 'ChatMicroservice',
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                name: 'ChatMicroservice',
                transport: Transport.TCP,
                options: {
                    host: 'localhost',
                    port: +configService.get<Number>('CHAT_MICROSERVICE_PORT')
                }
            })
    
        }
    ])],
    controllers: [],
    providers: [RoomService, DirectMessageService],
    exports: [RoomService, DirectMessageService]
})
export class ChatCommonModule {}
