import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLogger } from '@pokehub/common/logger';
import { IChatRoomData } from '@pokehub/room/interfaces';
import { UserEventMessage, UserNotificationEvent, UserSocketEvents, UserStatusEvent } from '@pokehub/event/user';
import { Inject } from '@nestjs/common';
import { AUTH_SERVICE, IAuthService } from '../auth/auth-service.interface';
import { IUserEventsPublisherService, USER_EVENTS_PUBLISHER_SERVICE } from '../pubsub/user-events-publisher-service.interface';

@WebSocketGateway({ cors: true })
export class UserEventsGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(@Inject(USER_EVENTS_PUBLISHER_SERVICE) private readonly userEventsPublisherService: IUserEventsPublisherService, 
              private readonly logger: AppLogger, @Inject(AUTH_SERVICE) private readonly authService: IAuthService) {
    logger.setContext(UserEventsGateway.name);
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
      this.logger.log(`handleConnection: A new client with id ${client.id} is trying to connect.`);
      if (!client.handshake.query.token) {
        this.logger.log(`handleConnection: No Authorization Token found while connecting to client with id ${client.id}. Disconnecting...`);
        client.disconnect();
      }

      await this.authService.decodeToken(client.handshake.query.token as string);
      this.logger.log(`handleConnection: Client ${client.id} Successfully connected to server`);
    } catch (err) {
      this.logger.error(`handleConnection: Got error while trying to connect with client: ${JSON.stringify(err)}. Disconnecting user`);
      client.disconnect(true);
      //throw err;
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
    //this.userEventsPublisherService.publishEvent( message, 
    //`${this.configService.get<string>( 'rabbitMQ.eventsExchange.userEventsRoutingPattern' )}.${UserEventTopics.USER_NOTIFICATIONS}` );
  }

  @SubscribeMessage(UserSocketEvents.USER_STATUS)
  async onUserStatus( @MessageBody() message: UserEventMessage<UserStatusEvent>, @ConnectedSocket() client: Socket ) {
    this.logger.log( `onUserStatus: Received message: ${JSON.stringify(message)}` );
    this.server.to(`${message.from.uid}-circle`).emit(UserSocketEvents.USER_STATUS, message);
    this.logger.log(`onUserStatus: Publishing User Status to Message Bus`);
    //this.eventMessageService.publishUserStatus(message);
  }

  @SubscribeMessage(UserSocketEvents.CLIENT_DETAILS)
  async onClientDetails( @MessageBody() message: UserEventMessage<{ publicRooms: IChatRoomData[] }>, @ConnectedSocket() client: Socket ) {
    this.logger.log( `onClientDetails: Received message ${JSON.stringify(message)}` );
    client.join(message.from.uid);
    client.join(`${message.from.uid}-circle`);
  }
}
