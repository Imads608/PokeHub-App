import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessageReceiverService } from './message-receiver.service';
import { MESSAGE_RECEIVER_SERVICE } from './message-receiver-service.interface';
import { CommonModule } from '../common/common.module';
//import { MessagingService } from './messaging.service';

@Module({
  imports: [
    CommonModule,
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          /*{
                    name: configService.get<string>('rabbitMQ.userEventsExchange'),
                    type: 'fanout'
                },*/ {
            name: configService.get<string>('rabbitMQ.eventsExchange.name'),
            type: 'topic',
          },
        ],
        uri: `amqp://${configService.get<string>(
          'rabbitMQ.host'
        )}:${configService.get<number>('rabbitMQ.port')}`,
      }),
    }),
  ],
  providers: [{ useClass: MessageReceiverService, provide: MESSAGE_RECEIVER_SERVICE }],
  exports: [],
})
export class MessagingModule {}
