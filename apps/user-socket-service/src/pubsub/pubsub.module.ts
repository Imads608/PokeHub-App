import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEventsPublisherService } from './user-events-publisher.service';
import { USER_EVENTS_PUBLISHER_SERVICE } from './user-events-publisher-service.interface';
import { UserEventsReceiverService } from './user-events-receiver.service';
import { USER_EVENTS_RECEIVER_SERVICE } from './user-events-receiver-service.interface';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, RabbitMQModule.forRootAsync(RabbitMQModule, {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      exchanges: [
        {
          name: configService.get<string>('rabbitMQ.eventsExchange.name'),
          type: 'topic',
          options: {
            durable: true
          }
        },
      ],
      uri: `amqp://${configService.get<string>('rabbitMQ.host')}:${configService.get<number>('rabbitMQ.port')}`,
    }),
  }),],
  providers: [{ useClass: UserEventsPublisherService, provide: USER_EVENTS_PUBLISHER_SERVICE }, 
              { useClass: UserEventsReceiverService, provide: USER_EVENTS_RECEIVER_SERVICE }],
  exports: [{ useClass: UserEventsPublisherService, provide: USER_EVENTS_PUBLISHER_SERVICE }],
})
export class PubSubModule {}
