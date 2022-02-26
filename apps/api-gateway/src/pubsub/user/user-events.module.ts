import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';
import { EventsCommonModule } from '../common/events-common.module';
import { UserEventsPublisherService } from './user-events-publisher.service';
import { USER_EVENTS_PUBLISHER_SERVICE } from './user-events-publisher-service.interface';
import { UserEventsReceiverService } from './user-events-receiver.service';
import { USER_EVENTS_RECEIVER_SERVICE } from './user-events-receiver-service.interface';
//import { MessagingService } from './messaging.service';

@Module({
  imports: [EventsCommonModule],
  providers: [{ useClass: UserEventsPublisherService, provide: USER_EVENTS_PUBLISHER_SERVICE }, 
              { useClass: UserEventsReceiverService, provide: USER_EVENTS_RECEIVER_SERVICE }],
  exports: [{ useClass: UserEventsPublisherService, provide: USER_EVENTS_PUBLISHER_SERVICE }],
})
export class UserEventsModule {}
