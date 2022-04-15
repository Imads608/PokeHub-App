import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';
import { ChatDBModule } from '@pokehub/chat/database';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: configService.get<string>('rabbitMQ.eventsExchange.name'),
            type: 'topic',
          },
        ],
        uri: `amqp://${configService.get<string>(
          'rabbitMQ.host'
        )}:${configService.get<number>('rabbitMQ.port')}`,
      }),
    }),
    CommonModule, ChatDBModule
  ],
  providers: [],
  exports: [CommonModule, RabbitMQModule, ChatDBModule],
})
export class PubSubCommonModule {}
