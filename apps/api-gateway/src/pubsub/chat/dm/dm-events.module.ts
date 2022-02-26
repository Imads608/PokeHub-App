import { Module } from '@nestjs/common';
import { EventsCommonModule } from '../../common/events-common.module';
import { DMEventsReceiverService } from './dm-events-receiver.service';
import { DM_EVENTS_RECEIVER_SERVICE } from './dm-events-receiver-service.interface';

@Module({
  imports: [EventsCommonModule],
  providers: [{ useClass: DMEventsReceiverService, provide: DM_EVENTS_RECEIVER_SERVICE }],
  exports: [],
})
export class DMEventsModule {}
