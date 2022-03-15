import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { EventEmitter2 } from 'eventemitter2';
import { UserEventMessage } from '@pokehub/event/user';
import { AppLogger } from '@pokehub/common/logger';
import { IUserEventsReceiverService } from './user-events-receiver-service.interface';

@Injectable()
export class UserEventsReceiverService implements IUserEventsReceiverService {
  constructor(private eventEmitter: EventEmitter2, private readonly logger: AppLogger) {
    this.logger.setContext(UserEventsReceiverService.name);
  }
  
  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.user',
  })
  async userEventsMessageHandler( msg: UserEventMessage<any>, amqpMsg: ConsumeMessage ) {
    this.logger.log(`userEventsMessageHandler: Received User Event Message with timestamp: ${amqpMsg.properties.timestamp}`);
    this.eventEmitter.emit(msg.messageType, msg);
    this.logger.log(`userEventsMessageHandler: Successfully emitted event to other connected clients`);
  }
}
