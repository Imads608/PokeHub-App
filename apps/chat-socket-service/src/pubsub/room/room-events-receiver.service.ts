import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { EventEmitter2 } from 'eventemitter2';
import { AppLogger } from '@pokehub/common/logger';
import { IRoomEventsReceiverService } from './room-events-receiver-service.interface';

@Injectable()
export class RoomEventsReceiverService implements IRoomEventsReceiverService {
  constructor(private eventEmitter: EventEmitter2, private readonly logger: AppLogger) {
    this.logger.setContext(RoomEventsReceiverService.name);
  }

  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.publicRooms',
  })
  async publicRoomEventsMessageHandler( msg: any, amqpMsg: ConsumeMessage ) {
    this.logger.log(`publicRoomEventsMessageHandler: Received User Event Message with timestamp: ${amqpMsg.properties.timestamp}`);
    this.eventEmitter.emit(msg.messageType, msg);
    this.logger.log(`publicRoomEventsMessageHandler: Successfully emitted event to other connected clients`);
  }
}
