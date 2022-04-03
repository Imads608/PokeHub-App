import { Module } from '@nestjs/common';
import { PubSubCommonModule } from '../common/pubsub-common.module';

@Module({
  imports: [PubSubCommonModule],
  providers: [],
  exports: [],
})
export class DMEventsModule {}
