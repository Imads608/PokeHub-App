import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { RoomService } from './room.service';
import { UserData } from '@pokehub/user'
import { ChatRoom, Participant } from '@pokehub/room';

@Controller()
export class RoomController {
    private logger = new Logger(RoomController.name);

    constructor(private roomService: RoomService) {}

    @MessagePattern({ cmd: 'chatroom-join' }, Transport.TCP)
    joinChatroom(userId: string, roomId: string): Promise<Participant> {
        this.logger.debug('Got request for user to join chatroom');
        return this.roomService.addNewParticipant(userId, roomId);
    }

    @MessagePattern({ cmd: 'user-joined-chatrooms' }, Transport.TCP)
    getUserChatrooms(userId: string): Promise<ChatRoom[]> {
        this.logger.debug('Got request for to get user joined chat rooms');
        return this.roomService.getUserJoinedRooms(userId);
        //return this.authService.emailLogin(user);
    }

    @MessagePattern({ cmd: 'get-public-chatrooms' }, Transport.TCP)
    getPublicChatrooms(): Promise<ChatRoom[]> {
        this.logger.debug('Got request to login user by email');
        return this.roomService.getAllPublicRooms();
        //return this.authService.emailLogin(user);
    }

    @MessagePattern({ cmd: 'get-public-chatroom' }, Transport.TCP)
    getPublicChatRoom(roomId: string): Promise<ChatRoom> {
        this.logger.debug('Got request to fetch Chatroom');
        return this.roomService.getPublicRoomById(roomId);
    }

    @MessagePattern({ cmd: 'get-public-chatroom-users' }, Transport.TCP)
    getPublicChatRoomUsers(roomId: string): Promise<Participant[]> {
        this.logger.debug('Got request to fetch users of ChatRoom');
        return this.roomService.getChatRoomParticipants(roomId);
    }

    @MessagePattern({ cmd: 'get-joined-public-chatrooms'}, Transport.TCP)
    getUserJoinedPublicChatRooms(userId: string): Promise<ChatRoom[]> {
        this.logger.debug('Got request to get All Public Chatrooms joined by user');
        return this.roomService.getUserJoinedRooms(userId);
    }
}
