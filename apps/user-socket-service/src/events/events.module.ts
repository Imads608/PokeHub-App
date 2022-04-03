import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { PubSubModule } from '../pubsub/pubsub.module';
import { UserEventsGateway } from './user-events.gateway';

@Module({
    imports: [CommonModule, AuthModule, PubSubModule],
    providers: [UserEventsGateway]
})
export class EventsModule {}
