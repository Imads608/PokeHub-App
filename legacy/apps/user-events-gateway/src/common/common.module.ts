import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@pokehub/common/logger';

@Module({
  imports: [LoggerModule, RabbitMQModule.forRootAsync(RabbitMQModule, {
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
        {
          name: configService.get<string>('rabbitMQ.userEventsExchange.name'),
          type: 'topic',
          options: {
            durable: true
          }
        },
      ],
      uri: `amqp://${configService.get<string>('rabbitMQ.host')}:${configService.get<number>('rabbitMQ.port')}`,
    }),
  })],
  exports: [LoggerModule, RabbitMQModule],
})
export class CommonModule {}
