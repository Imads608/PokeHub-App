import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
  } from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
//import { MessagingService } from '../messaging/messaging.service';
import { UserEventMessage, EventUserTopics, SocketUserEvents, UserNotificationEvent } from '@pokehub/events';
import { EventEmitter2 } from 'eventemitter2';
import { OnEvent } from '@nestjs/event-emitter';
import { UserEventsMessageService } from '../messaging/user-events-message.service';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@pokehub/user';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private readonly logger = new Logger(EventsGateway.name);

    constructor(private eventEmitter: EventEmitter2, private eventMessageService: UserEventsMessageService, private configService: ConfigService) {}

    @OnEvent(SocketUserEvents.USER_STATUS)
    handleUserStatus(message: UserEventMessage) {
        this.server.to(message.from.uid).emit(SocketUserEvents.USER_STATUS, message);
    }

    @OnEvent(SocketUserEvents.USER_NOTIFICATIONS)
    handleUserNotifications(message: UserEventMessage) {
        this.server.to(`${message.from.uid}-circle`).emit(SocketUserEvents.USER_NOTIFICATIONS);
    }

    handleDisconnect(client: Socket) {
        this.logger.log('Client Disconnected');
    }

    @SubscribeMessage('events')
    findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
        return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
    }

    @SubscribeMessage('identity')
    async identity(@MessageBody() data: number, @ConnectedSocket() client: Socket): Promise<number> {
        return data;
    }

    @SubscribeMessage(SocketUserEvents.USER_NOTIFICATIONS)
    async onUserNotification(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got message in User Notifications Handler');
        const data = message.data as UserNotificationEvent;
        if (data.shouldReceive) {
            client.join(`${data.subscribedUserUid}-circle`);
        } else
            client.leave(`${data.subscribedUserUid}-circle`);

        this.eventMessageService.publishEvent(message, 
            `${this.configService.get<string>('rabbitMQ.eventsExchange.userEventsRoutingPattern')}.${EventUserTopics.USER_NOTIFICATIONS}`);
    }

    @SubscribeMessage(SocketUserEvents.USER_STATUS)
    async onUserStatus(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got message in User Status Handler');
        this.server.to(`${message.from.uid}-circle`).emit(SocketUserEvents.USER_STATUS, message);
        this.eventMessageService.publishUserStatus(message);
    }

    @SubscribeMessage(SocketUserEvents.CLIENT_DETAILS)
    async onClientDetails(@MessageBody() message: UserEventMessage, @ConnectedSocket() client: Socket) {
        this.logger.log('Got client details: ' + JSON.stringify(message));
        const data = message.data as { publicRooms: string[], privateRooms: []};

        data.publicRooms && data.publicRooms.forEach(room => client.join(room));
        data.privateRooms && data.privateRooms.forEach(room => client.join(room));
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