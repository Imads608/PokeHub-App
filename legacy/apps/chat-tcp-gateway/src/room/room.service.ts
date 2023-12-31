import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppLogger } from '@pokehub/common/logger';
import { ChatRoom, Participant } from '@pokehub/room/database';
import { ChatServiceEndpoints } from '@pokehub/room/endpoints';
import { UserData } from '@pokehub/user/models';
import { firstValueFrom } from 'rxjs';
import { IRoomService } from './room-service.interface';

@Injectable()
export class RoomService implements IRoomService {
    constructor(@Inject('ChatService') private readonly clientProxy: ClientProxy, private readonly logger: AppLogger) {
        logger.setContext(RoomService.name);
    }

    async addNewParticipant(userId: string, roomId: string): Promise<Participant> {
        try {
            this.logger.log(`addNewParticipant: Adding New Participant with user if ${userId} to room ${roomId}`);
            const res = await firstValueFrom(this.clientProxy.send<Participant>({ cmd: ChatServiceEndpoints.JOIN_CHATROOM }, { userId, roomId }));
            this.logger.log(`addNewParticipant: Successfully received response from Adding New Participant ${userId} to room ${roomId}`);
            return res;
        } catch (err) {
            this.logger.error(`addNewParticipant: Got error while trying to add new Participant with user id ${userId} to room ${roomId}: ${err.message}`, err.stack);
            throw err;
        }
    }
    
    async getChatRoomParticipants(roomId: string): Promise<Participant[]> {
        try {
            this.logger.log(`getChatRoomParticipants: Retrieving List of Chat Room Participants for room ${roomId}`);
            const res = await firstValueFrom(this.clientProxy.send<Participant[]>({ cmd: ChatServiceEndpoints.GET_PUBLIC_CHATROOM_USERS }, roomId));
            this.logger.log(`getChatRoomParticipants: Successfully retrieved response from Chat Service for room ${roomId}`);
            return res;
        } catch (err) {
            this.logger.error(`getChatRoomParticipants: Got error while trying to retrieve Participants for ChatRoom ${roomId}: ${err.message}`, err.stack);
            throw err;
        }
    }
    
    async getAllPublicRooms(): Promise<ChatRoom[]> {
        try {
          this.logger.log( `getAllPublicRooms: Retrieving all Public Chat Rooms from Chat Service` );
          const chatrooms: ChatRoom[] = await firstValueFrom( this.clientProxy.send<ChatRoom[]>( { cmd: ChatServiceEndpoints.GET_PUBLIC_CHATROOMS }, '' ) );
          this.logger.log( `getAllPublicRooms: Successfully retrieved all Public Chat Rooms from Chat Service` );
          return chatrooms;
        } catch (err) {
          this.logger.error( `getAllPublicRooms: Got error while retrieving all Public Chat Rooms: ${err.message}`, err.stack);
          throw err;
        }
      }
    
      async getPublicRoomFromId(roomId: string): Promise<ChatRoom> {
        try {
          this.logger.log( `getPublicRoomFromId: Retrieving Public Chat Room Data for Room ${roomId}` );
          const chatroom: ChatRoom = await firstValueFrom( this.clientProxy.send<ChatRoom>( { cmd: ChatServiceEndpoints.GET_PUBLIC_CHATROOM }, roomId ) );
          this.logger.log( `getPublicRoomFromId: Succesfully retrieved Data for Room ${roomId}` );
          return chatroom;
        } catch (err) {
          this.logger.error( `getPublicRoomFromId: Got error while retrieving Public Chat Room data for Id ${roomId}: ${err.message}`, err.stack);
          throw err;
        }
      }
    
      async getPublicRoomUsers(roomId: string): Promise<UserData[]> {
        try {
          this.logger.log( `getPublicRoomUsers: Retrieving Users for Public Chat Room ${roomId}` );
          const users: UserData[] = await firstValueFrom( this.clientProxy.send<UserData[]>( { cmd: ChatServiceEndpoints.GET_PUBLIC_CHATROOM_USERS }, roomId ) );
          this.logger.log( `getPublicRoomUsers: Successfully retrieved Users for Public Chat Room ${roomId}` );
          return users;
        } catch (err) {
          this.logger.error( `getPublicRoomUsers: Got error while retrieving Users from Public Room ${roomId}: ${err.message}`, err.stack);
          throw err;
        }
      }
    
      async getJoinedPublicRoomsForUser(userId: string): Promise<ChatRoom[]> {
        try {
          this.logger.log( `getJoinedPublicRoomsForUser: Retrieving Public Chat Rooms User ${userId} has joined` );
          const chatrooms: ChatRoom[] = await firstValueFrom( this.clientProxy.send<ChatRoom[]>( { cmd: ChatServiceEndpoints.GET_USER_JOINED_CHATROOMS }, userId ) );
          this.logger.log( `getJoinedPublicRoomsForUser: Successfully retrieved Public Chat Rooms User ${userId} has joined` );
          return chatrooms;
        } catch (err) {
          this.logger.error( `getJoinedPublicRoomsForUser: Got error while retrieving Public Chat Rooms User ${userId} has joined: ${err.message}`, err.stack);
          throw err;
        }
      }
}
