import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { EventEmitter2 } from 'eventemitter2';
import { AppLogger } from '@pokehub/common/logger';
import { IDMEventsReceiverService } from './dm-events-receiver-service.interface';

@Injectable()
export class DMEventsReceiverService implements IDMEventsReceiverService {
  constructor(private eventEmitter: EventEmitter2, private readonly logger: AppLogger) {
    this.logger.setContext(DMEventsReceiverService.name);
  }

  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.dm',
  })
  async dmEventsMessageHandler( msg: any, amqpMsg: ConsumeMessage ) {
    this.logger.log(`dmEventsMessageHandler: Received User Event Message with timestamp: ${amqpMsg.properties.timestamp}`);
    this.eventEmitter.emit(msg.messageType, msg);
    this.logger.log(`dmEventsMessageHandler: Successfully emitted event to other connected clients`);
  }
}
