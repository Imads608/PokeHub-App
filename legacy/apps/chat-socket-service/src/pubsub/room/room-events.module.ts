import { Module } from '@nestjs/common';
import { RoomEventsReceiverService } from './room-events-receiver.service';
import { ROOM_EVENTS_RECEIVER_SERVICE } from './room-events-receiver-service.interface';
import { PubSubCommonModule } from '../common/pubsub-common.module';

@Module({
  imports: [PubSubCommonModule],
  providers: [{ useClass: RoomEventsReceiverService, provide: ROOM_EVENTS_RECEIVER_SERVICE }],
  exports: [],
})
export class RoomEventsModule {}
