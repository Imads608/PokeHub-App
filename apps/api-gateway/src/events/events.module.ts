import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { MessagingModule } from '../messaging/messaging.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [MessagingModule, CommonModule],
  providers: [EventsGateway],
})
export class EventsModule {}
