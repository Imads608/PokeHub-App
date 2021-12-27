/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AppLogger } from '@pokehub/logger';
import { ChatRoom } from '@pokehub/room';
import { UserData } from '@pokehub/user';
import { AuthGuard } from '../../common/auth.guard';
import { IRoomService, ROOM_SERVICE } from '../common/room-service.interface';

@Controller()
export class RoomController {
  constructor(
    @Inject(ROOM_SERVICE) private roomService: IRoomService,
    private readonly logger: AppLogger
  ) {
    logger.setContext(RoomController.name);
  }

  @UseGuards(AuthGuard)
  @Get()
  getAllPublicRooms(): Promise<ChatRoom[]> {
    this.logger.log(
      `getAllPublicRooms: Got request to retrieve All Public Chat Rooms`
    );
    return this.roomService.getAllPublicRooms();
  }

  @UseGuards(AuthGuard)
  @Get(':roomId')
  getPublicRoomDetails(@Param() params): Promise<ChatRoom> {
    this.logger.log(
      `getPublicRoomDetails: Got request to retrieve data for Public Chat Room ${params.roomId}`
    );
    return this.roomService.getPublicRoomFromId(params.roomId);
  }

  @UseGuards(AuthGuard)
  @Get(':roomId/users')
  getUsersForPublicRoom(@Param() params): Promise<UserData[]> {
    this.logger.log(
      `getUsersForPublicRoom: Got request to retrieve all Users for Public Chat Room ${params.roomId}`
    );
    return this.roomService.getPublicRoomUsers(params.roomId);
  }

  @UseGuards(AuthGuard)
  @Post(':roomId/users')
  addUserToPublicRoom() {
    // TODO
  }
}
