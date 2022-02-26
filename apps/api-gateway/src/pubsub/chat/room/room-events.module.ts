import { Module } from '@nestjs/common';
import { EventsCommonModule } from '../../common/events-common.module';
import { RoomEventsReceiverService } from './room-events-receiver.service';
import { ROOM_EVENTS_RECEIVER_SERVICE } from './room-events-receiver-service.interface';

@Module({
  imports: [EventsCommonModule],
  providers: [{ useClass: RoomEventsReceiverService, provide: ROOM_EVENTS_RECEIVER_SERVICE }],
  exports: [],
})
export class RoomEventsModule {}
