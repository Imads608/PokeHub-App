import { Module } from '@nestjs/common';
import { DMEventsModule } from './dm/dm-events.module';
import { RoomEventsModule } from './room/room-events.module';

@Module({
  imports: [DMEventsModule, RoomEventsModule],
  providers: [],
  exports: [],
})
export class ChatEventsModule {}
