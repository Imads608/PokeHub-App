import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { ConsumeMessage } from 'amqplib';
import { EventEmitter2 } from 'eventemitter2';
import { Socket } from 'socket.io';
import { UserEventMessage, UserEventTopics } from '@pokehub/event/user';

@Injectable()
export class UserEventsMessageService {
  private readonly logger = new Logger(UserEventsMessageService.name);

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private amqpConnection: AmqpConnection
  ) {}
  /*
    @RabbitSubscribe({
        exchange: 'user-events-exchange',
        queue: '',
        routingKey: ''
    })
    public async msgHandler(msg: UserEventMessage, amqpMsg: ConsumeMessage) {
        this.logger.log('Got msg from user-exchange');
        if (msg.messageType === SocketEvents.USER_AVAILABLE) {
            this.eventEmitter.emit(SocketLocalEvents.USER_AVAILABLE, msg);
        } else if (msg.messageType === SocketEvents.USER_AWAY) {
            this.eventEmitter.emit(SocketLocalEvents.USER_AWAY, msg);
        }
    }
*/
  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.user.*',
  })
  public async userEventsMessageHandler( msg: UserEventMessage<any>, amqpMsg: ConsumeMessage ) {
    this.logger.log('Got msg from events-exchange');
    this.eventEmitter.emit(msg.messageType, msg);
  }

  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.publicRooms.*',
  })
  public async publicRoomEventsMessageHandler( msg: any, amqpMsg: ConsumeMessage ) {
    this.logger.log('Got msg from public room events');
    this.eventEmitter.emit(msg.messageType, msg);
  }

  @RabbitSubscribe({
    exchange: 'events-exchange',
    queue: '',
    routingKey: 'events.dms.*',
  })
  public async dmEventsMessageHandler(msg: any, amqpMsg: ConsumeMessage) {
    this.logger.log('Got msg from dm events');
    this.eventEmitter.emit(msg.messageType, msg);
  }

  async publishUserStatus(message: any): Promise<void> {
    await this.amqpConnection.publish('events-exchange', 
        `${this.configService.get<string>( 'rabbitMQ.eventsExchange.userEventsRoutingPattern' )}.${UserEventTopics.USER_STATUS}`, message );
    return;
  }

  async publishEvent(message: any, routingKey: string): Promise<void> {
    await this.amqpConnection.publish('events-exchange', routingKey, message);
  }
}
