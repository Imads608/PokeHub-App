import { Module } from '@nestjs/common';
import { ChatEventsModule } from './chat/chat-events.module';
import { UserEventsModule } from './user/user-events.module';

@Module({
  imports: [ ChatEventsModule, UserEventsModule ],
  providers: [],
  exports: [ChatEventsModule, UserEventsModule],
})
export class PubSubModule {}
