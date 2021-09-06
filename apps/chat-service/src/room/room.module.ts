import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom, Participant } from '@pokehub/room';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, Participant])],
  providers: [RoomService],
  controllers: [RoomController],
})
export class RoomModule {}
