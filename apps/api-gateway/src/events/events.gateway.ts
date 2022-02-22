import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse, } from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
//import { MessagingService } from '../messaging/messaging.service';
//import { UserEventMessage, EventUserTopics, SocketUserEvents, UserNotificationEvent, } from '@pokehub/events';
import { EventEmitter2 } from 'eventemitter2';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEventsMessageService } from '../messaging/user-events-message.service';
import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@pokehub/common/logger';
import { IChatRoomData } from '@pokehub/room/interfaces';
import { UserEventMessage, UserEventTopics, UserNotificationEvent, UserSocketEvents, UserStatusEvent } from '@pokehub/event/user';
import { Inject } from '@nestjs/common';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private eventEmitter: EventEmitter2, private eventMessageService: UserEventsMessageService, private configService: ConfigService, 
    private readonly logger: AppLogger, @Inject(AUTH_SERVICE) private authService: IAuthService) {
    logger.setContext(EventsGateway.name);
  }

  @OnEvent(UserSocketEvents.USER_STATUS)
  handleUserStatus(message: UserEventMessage<UserStatusEvent>) {
    this.logger.log( `handleUserStatus: Received Event: ${JSON.stringify(message)}` );
    this.server.to(`${message.from.uid}-circle`).emit(UserSocketEvents.USER_STATUS, message);
  }

  @OnEvent(UserSocketEvents.USER_NOTIFICATIONS)
  handleUserNotifications(message: UserEventMessage<any>) {
    this.logger.log( `handleUserNotifications: Received Event: ${JSON.stringify(message)}` );
    this.server.to(`${message.from.uid}-circle`).emit(UserSocketEvents.USER_NOTIFICATIONS);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      this.logger.log(`handleConnection: A new client with id ${client.id} is trying to connect`);
      if (!client.handshake.query.token) {
        this.logger.log(`handleConnection: No Authorization Token found while connecting to client with id ${client.id}. Disconnecting`);
        client.disconnect();
      }

      await this.authService.decodeToken(client.handshake.query.token as string);
      this.logger.log(`handleConnection: Client ${client.id} Successfully connected to server`);
    } catch (err) {
      this.logger.error(`handleConnection: Got error while trying to connect with client: ${JSON.stringify(err)}. Disconnecting`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`handleDisconnect: Client ${client.id} Disconnected`);
  }

  @SubscribeMessage(UserSocketEvents.USER_NOTIFICATIONS)
  async onUserNotification( @MessageBody() message: UserEventMessage<any>, @ConnectedSocket() client: Socket ) {
    this.logger.log( `onUserNotification: Received message: ${JSON.stringify(message)}` );
    const data = message.data as UserNotificationEvent;
    if (data.shouldReceive) {
      this.logger.log( `onUserNotification: Client ${client.id} joining ${data.subscribedUserUid}-circle` );
      client.join(`${data.subscribedUserUid}-circle`);
    } else {
      this.logger.log( `onUserNotification: Client ${client.id} leaving ${data.subscribedUserUid}-circle` );
      client.leave(`${data.subscribedUserUid}-circle`);
    }
    this.logger.log(`onUserNotification: Publishing Event to Message Bus`);
    this.eventMessageService.publishEvent( message, 
    `${this.configService.get<string>( 'rabbitMQ.eventsExchange.userEventsRoutingPattern' )}.${UserEventTopics.USER_NOTIFICATIONS}` );
  }

  @SubscribeMessage(UserSocketEvents.USER_STATUS)
  async onUserStatus( @MessageBody() message: UserEventMessage<UserStatusEvent>, @ConnectedSocket() client: Socket ) {
    this.logger.log( `onUserStatus: Received message: ${JSON.stringify(message)}` );
    this.server.to(`${message.from.uid}-circle`).emit(UserSocketEvents.USER_STATUS, message);
    this.logger.log(`onUserStatus: Publishing User Status to Message Bus`);
    this.eventMessageService.publishUserStatus(message);
  }

  @SubscribeMessage(UserSocketEvents.CLIENT_DETAILS)
  async onClientDetails( @MessageBody() message: UserEventMessage<{ publicRooms: IChatRoomData[] }>, @ConnectedSocket() client: Socket ) {
    this.logger.log( `onClientDetails: Received message ${JSON.stringify(message)}` );
    message.data.publicRooms && message.data.publicRooms.forEach((room) => client.join(room.id));
    //data.privateRooms && data.privateRooms.forEach((room) => client.join(room.id));
    client.join(message.from.uid);
    client.join(`${message.from.uid}-circle`);
  }

  /*
    @SubscribeMessage(SocketEvents.RECEIVE_USER_NOTIFICATIONS)
    async onReceiveUserNotifications(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got message in Receive User Notifications Handler');
        const data = message.data as { userUid: string };
        client.join(data.userUid);
        this.eventMessageService.publishEvent(message, `${this.configService.get<string>('rabbitMQ.eventsExchange.userEventsRoutingPattern')}.${EventUserTopics.USER_NOTIFICATIONS}`);        //this.eventEmitter.emit('rabbit.user.receiveNotifications', message);
    }

    @SubscribeMessage(SocketEvents.STOP_USER_NOTIFICATIONS)
    async onStopReceivingUserNotifications(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got messag in Stop Receive User Notifications handler');
        const data = message.data as { userUid: string };
        client.leave(data.userUid);
        this.eventMessageService.publishEvent(message, `${this.configService.get<string>('rabbitMQ.eventsExchange.userEventsRoutingPattern')}.${EventUserTopics.USER_NOTIFICATIONS}`);
    }
    

    @SubscribeMessage(SocketEvents.USER_AVAILABLE)
    async onUserAvailable(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got message in User Available Handler');
        this.server.to(message.from.uid).emit(SocketEvents.USER_AVAILABLE, message);
        this.eventMessageService.publishUserStatus(message);
        //this.eventEmitter.emit('rabbit.user.available', message);
    }

    @SubscribeMessage(SocketEvents.USER_AWAY)
    async onUserAway(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got message in User Away Handler');
        this.server.to(message.from.uid).emit(SocketEvents.USER_AWAY, message);
        this.eventMessageService.publishUserStatus(message);
        //this.eventEmitter.emit('rabbit.user.away', message);
    }

    @SubscribeMessage(SocketEvents.CLIENT_DETAILS)
    async onClientDetails(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got client details: ' + JSON.stringify(message));
        const data = message.data as { publicRooms: string[], privateRooms: []};

        data.publicRooms && data.publicRooms.forEach(room => client.join(room));
        data.privateRooms && data.privateRooms.forEach(room => client.join(room));
        client.join(message.from.uid);
        /*this.logger.log('Got client details: ' + JSON.stringify(data));
        data.publicRooms && data.publicRooms.forEach(room => client.join(room));
        data.privateRooms && data.privateRooms.forEach(room => client.join(room));
        client.join(data.uid);*/
  //await this.messagingService.publishChatMessage();
  // return 1;
}
