import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { STATUS_EVENTS_PUBLISHER_SERVICE } from './status-events-publisher-service.interface';
import { StatusEventsPublisherService } from './status-events-publisher.service';
import { STATUS_MESSAGE_RECEIVER_SERVICE } from './status-message-receiver-service.interface';
import { StatusMessageReceiverService } from './status-message-receiver.service';

@Module({
  imports: [CommonModule],
  providers: [ { useClass: StatusMessageReceiverService, provide: STATUS_MESSAGE_RECEIVER_SERVICE },
               { useClass: StatusEventsPublisherService, provide: STATUS_EVENTS_PUBLISHER_SERVICE } ]
})
export class StatusEventsModule {}
