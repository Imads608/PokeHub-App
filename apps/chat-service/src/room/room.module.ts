import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, Participant } from '@pokehub/room';
import { LoggerModule } from '@pokehub/logger';
import { ROOM_SERVICE } from './room-service.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, Participant]), LoggerModule],
  providers: [{ useClass: RoomService, provide: ROOM_SERVICE }],
  controllers: [RoomController],
})
export class RoomModule {}
