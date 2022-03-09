import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PubSubModule } from '../pubsub/pubsub.module';
import { DMEventsGateway } from './dm-events.gateway';
import { RoomEventsGateway } from './room-events.gateway';
import { UserEventsGateway } from './user-events.gateway';

@Module({
  imports: [PubSubModule, CommonModule],
  providers: [UserEventsGateway, RoomEventsGateway, DMEventsGateway],
})
export class EventsModule {}
