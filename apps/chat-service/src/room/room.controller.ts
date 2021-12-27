import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { ChatRoom, Participant, TCPEndpoints } from '@pokehub/room';
import { AppLogger } from '@pokehub/logger';
import { IRoomService, ROOM_SERVICE } from './room-service.interface';

@Controller()
export class RoomController {
  constructor(
    @Inject(ROOM_SERVICE) private roomService: IRoomService,
    private readonly logger: AppLogger
  ) {
    logger.setContext(RoomController.name);
  }

  @MessagePattern({ cmd: TCPEndpoints.CHATROOM_JOIN }, Transport.TCP)
  joinChatroom(userId: string, roomId: string): Promise<Participant> {
    this.logger.log(
      `joinChatRoom: Got Request for user ${userId} to join chatroom ${roomId}`
    );
    return this.roomService.addNewParticipant(userId, roomId);
  }

  @MessagePattern({ cmd: TCPEndpoints.USER_JOINED_CHATROOMS }, Transport.TCP)
  getUserChatrooms(userId: string): Promise<ChatRoom[]> {
    this.logger.log(
      `getUserChatrooms: Got request to fetch all Chatrooms User ${userId} has joined`
    );
    return this.roomService.getUserJoinedRooms(userId);
  }

  @MessagePattern({ cmd: TCPEndpoints.GET_PUBLIC_CHATROOMS }, Transport.TCP)
  getPublicChatrooms(): Promise<ChatRoom[]> {
    this.logger.log(
      `getPublicChatrooms: Got request to fetch all Public Chatrooms`
    );
    return this.roomService.getAllPublicRooms();
  }

  @MessagePattern({ cmd: TCPEndpoints.GET_PUBLIC_CHATROOM }, Transport.TCP)
  getPublicChatRoom(roomId: string): Promise<ChatRoom> {
    this.logger.log(
      `getPublicChatroom: Got request to fetch data related to chatroom ${roomId}`
    );
    return this.roomService.getPublicRoomById(roomId);
  }

  @MessagePattern(
    { cmd: TCPEndpoints.GET_PUBLIC_CHATROOM_USERS },
    Transport.TCP
  )
  getPublicChatRoomUsers(roomId: string): Promise<Participant[]> {
    this.logger.log(
      `getPublicChatRoomUsers: Got request to retrieve all Participants of Chatroom ${roomId}`
    );
    return this.roomService.getChatRoomParticipants(roomId);
  }
}
