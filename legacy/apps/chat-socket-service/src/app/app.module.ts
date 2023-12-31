import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { EventsModule } from '../events/events.module';
import { PubSubModule } from '../pubsub/pubsub.module';
// Comment for testing
@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
  }), EventEmitterModule.forRoot(), AuthModule, CommonModule, PubSubModule, EventsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
