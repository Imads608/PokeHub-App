import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PubSubModule } from '../pubsub/pubsub.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [PubSubModule, CommonModule],
  providers: [EventsGateway],
})
export class EventsModule {}
