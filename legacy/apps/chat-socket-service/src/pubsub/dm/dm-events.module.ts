import { Module } from '@nestjs/common';
import { DMEventsReceiverService } from './dm-events-receiver.service';
import { DM_EVENTS_RECEIVER_SERVICE } from './dm-events-receiver-service.interface';
import { PubSubCommonModule } from '../common/pubsub-common.module';

@Module({
  imports: [PubSubCommonModule],
  providers: [{ useClass: DMEventsReceiverService, provide: DM_EVENTS_RECEIVER_SERVICE }],
  exports: [],
})
export class DMEventsModule {}
