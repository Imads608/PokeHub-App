/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ChatRoom } from '@pokehub/room';
import { UserData } from '@pokehub/user';
import { AuthGuard } from '../../common/auth.guard';
import { RoomService } from '../common/room.service';

@Controller()
export class RoomController { 
    private readonly logger = new Logger(RoomController.name);

    constructor(private roomService: RoomService) {}

    @UseGuards(AuthGuard)
    @Get()
    getAllPublicRooms(): Promise<ChatRoom[]> {
        return this.roomService.getAllPublicRooms();
    }

    @UseGuards(AuthGuard)
    @Get(":roomId")
    getPublicRoomDetails(@Param() params): Promise<ChatRoom> {
        return this.roomService.getPublicRoomFromId(params.roomId);
    }

    @UseGuards(AuthGuard)
    @Get(':roomId/users')
    getUsersForPublicRoom(@Param() params): Promise<UserData[]> {
        return this.roomService.getPublicRoomUsers(params.roomId);
    }

    @UseGuards(AuthGuard)
    @Post(':roomId/users')
    addUserToPublicRoom() {

    }

}
