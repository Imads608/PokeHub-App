import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
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
    CommonModule,
  ],
  providers: [],
  exports: [CommonModule, RabbitMQModule],
})
export class EventsCommonModule {}
