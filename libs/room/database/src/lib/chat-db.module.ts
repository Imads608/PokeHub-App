import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Participant } from './entities/participant.entity';
import { LoggerModule } from '@pokehub/common/logger';
import { RoomService } from './services/room.service';
import { ROOM_SERVICE } from './services/room-service.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, Participant]), LoggerModule],
  providers: [{ useClass: RoomService, provide: ROOM_SERVICE }],
  exports: [{ useClass: RoomService, provide: ROOM_SERVICE }]
})
export class ChatDBModule {}
