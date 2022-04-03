import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ChatController } from './chat.controller';
import { DirectMessageModule } from './dm/direct-message.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [CommonModule, RoomModule, DirectMessageModule],
  controllers: [ChatController],
  providers: [],
})
export class ChatModule {}
