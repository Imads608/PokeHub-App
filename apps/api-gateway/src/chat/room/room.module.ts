/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatCommonModule } from '../common/chat-common.module';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [CommonModule, ChatCommonModule],
    controllers: [RoomController],
    providers: [],
})
export class RoomModule { }
