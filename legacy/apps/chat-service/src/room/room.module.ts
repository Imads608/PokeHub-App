import { Module } from '@nestjs/common';
import { RoomController } from './room.controller';
import { ChatDBModule } from '@pokehub/room/database';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ChatDBModule, CommonModule],
  controllers: [RoomController],
})
export class RoomModule {}
