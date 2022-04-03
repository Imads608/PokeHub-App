import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DMEventsModule } from './dm/dm-events.module';
import { RoomEventsModule } from './room/room-events.module';

@Module({
    imports: [DMEventsModule, RoomEventsModule]
})
export class PubSubModule {}
