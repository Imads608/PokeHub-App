/*
https://docs.nestjs.com/providers#services
*/

import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppLogger } from '@pokehub/common/logger';
import { ChatRoom } from '@pokehub/room/database';
import { ChatTCPGatewayEndpoints } from '@pokehub/room/endpoints';
import { UserData } from '@pokehub/user/models';
import { firstValueFrom } from 'rxjs';
import { IRoomService } from './room-service.interface';

@Injectable()
export class RoomService implements IRoomService {
  constructor( @Inject('ChatTCPGateway') private readonly clientProxy: ClientProxy, private readonly logger: AppLogger ) {
    logger.setContext(RoomService.name);
  }

  async getAllPublicRooms(): Promise<ChatRoom[]> {
    try {
      this.logger.log( `getAllPublicRooms: Retrieving all Public Chat Rooms from Chat Service` );
      const chatrooms: ChatRoom[] = await firstValueFrom( this.clientProxy.send<ChatRoom[]>( { cmd: ChatTCPGatewayEndpoints.GET_PUBLIC_CHATROOMS }, '' ) );
      this.logger.log( `getAllPublicRooms: Successfully retrieved all Public Chat Rooms from Chat Service` );
      return chatrooms;
    } catch (err) {
      this.logger.error( `getAllPublicRooms: Got error while retrieving all Public Chat Rooms: ${err}` );
      throw err;
    }
  }

  async getPublicRoomFromId(roomId: string): Promise<ChatRoom> {
    try {
      this.logger.log( `getPublicRoomFromId: Retrieving Public Chat Room Data for Room ${roomId}` );
      const chatroom: ChatRoom = await firstValueFrom( this.clientProxy.send<ChatRoom>( { cmd: ChatTCPGatewayEndpoints.GET_PUBLIC_CHATROOM }, roomId ) );
      this.logger.log( `getPublicRoomFromId: Succesfully retrieved Data for Room ${roomId}` );
      return chatroom;
    } catch (err) {
      this.logger.error( `getPublicRoomFromId: Got error while retrieving Public Chat Room data for Id ${roomId}: ${err}` );
      throw err;
    }
  }

  async getPublicRoomUsers(roomId: string): Promise<UserData[]> {
    try {
      this.logger.log( `getPublicRoomUsers: Retrieving Users for Public Chat Room ${roomId}` );
      const users: UserData[] = await firstValueFrom( this.clientProxy.send<UserData[]>( { cmd: ChatTCPGatewayEndpoints.GET_PUBLIC_CHATROOM_USERS }, roomId ) );
      this.logger.log( `getPublicRoomUsers: Successfully retrieved Users for Public Chat Room ${roomId}` );
      return users;
    } catch (err) {
      this.logger.error( `getPublicRoomUsers: Got error while retrieving Users from Public Room ${roomId}: ${err}` );
      throw err;
    }
  }

  async getJoinedPublicRoomsForUser(userId: string): Promise<ChatRoom[]> {
    try {
      this.logger.log( `getJoinedPublicRoomsForUser: Retrieving Public Chat Rooms User ${userId} has joined` );
      const chatrooms: ChatRoom[] = await firstValueFrom( this.clientProxy.send<ChatRoom[]>( { cmd: ChatTCPGatewayEndpoints.GET_USER_JOINED_CHATROOMS }, userId ) );
      this.logger.log( `getJoinedPublicRoomsForUser: Successfully retrieved Public Chat Rooms User ${userId} has joined` );
      return chatrooms;
    } catch (err) {
      this.logger.error( `getJoinedPublicRoomsForUser: Got error while retrieving Public Chat Rooms User ${userId} has joined: ${err}` );
      throw err;
    }
  }
}
