import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { EventsGateway } from './events.gateway';

@Module({
    imports: [MessagingModule],
    providers: [EventsGateway]
})
export class EventsModule {}
