/*
https://docs.nestjs.com/providers#services
*/

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ChatRoom } from '@pokehub/room';
import { UserData } from '@pokehub/user';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoomService { 
    private readonly logger = new Logger(RoomService.name);

    constructor(@Inject("ChatMicroservice") private readonly clientProxy: ClientProxy) {}

    async getAllPublicRooms(): Promise<ChatRoom[]> {
        const chatrooms: ChatRoom[] = await firstValueFrom(this.clientProxy.send<ChatRoom[]>({ cmd: 'get-public-chatrooms' }, ''));
        return chatrooms;
    }

    async getPublicRoomFromId(roomId: string): Promise<ChatRoom> {
        const chatroom: ChatRoom = await firstValueFrom(this.clientProxy.send<ChatRoom>({ cmd: 'get-public-chatroom' }, roomId));
        return chatroom;
    }

    async getPublicRoomUsers(roomId: string): Promise<UserData[]> {
        const users: UserData[] = await firstValueFrom(this.clientProxy.send<UserData[]>({ cmd: 'get-public-chatroom-users'}, roomId));
        return users;
    }

    async getJoinedPublicRoomsForUser(userId: string): Promise<ChatRoom[]> {
        const chatrooms: ChatRoom[] = await firstValueFrom(this.clientProxy.send<ChatRoom[]>({ cmd: 'get-joined-public-chatrooms' }, userId));
        return chatrooms;
    }
}
