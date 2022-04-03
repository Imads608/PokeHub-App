import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import { UserDBModule } from '@pokehub/user/database';
import { MessageReceiverService } from './message-receiver.service';
import { MESSAGE_RECEIVER_SERVICE } from './message-receiver-service.interface';

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
  providers: [{ useClass: MessageReceiverService, provide: MESSAGE_RECEIVER_SERVICE }],
})
export class PubSubModule {}
