import { BadRequestException, Body, Controller, Get, HttpStatus, Logger, Param, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { CreateUserRequest, UserData, UserDataWithToken, UserPublicProfile, UserPublicProfileWithToken } from '@pokehub/user';
import { CreateUserInterceptor } from './create-user.interceptor';
import { UserService } from './user.service';
import { User } from '../common/user.decorator';
import { JwtTokenBody } from '@pokehub/auth';
import { AuthGuard } from '../common/auth.guard';
import { LoginInterceptor } from '../auth/login.interceptor';
import { RoomService } from '../chat/common/room.service';

@Controller()
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService, private readonly roomService: RoomService) {}

    @UseInterceptors(CreateUserInterceptor)
    @Post()
    async create(@Body() createUserData: CreateUserRequest): Promise<UserPublicProfileWithToken> {
        this.logger.log('Got request to create user with username: ' + createUserData.username);
        const userWithToken: UserDataWithToken = await this.userService.createUser(createUserData);
        const joinedRooms = await this.roomService.getJoinedPublicRoomsForUser(userWithToken.user.uid);
        return new UserPublicProfileWithToken(userWithToken.user, userWithToken.accessToken, userWithToken.refreshToken, joinedRooms);
    }

    @UseInterceptors(LoginInterceptor)
    @UseGuards(AuthGuard)
    @Get('auth')
    loadUser(@Req() req: Request, @User() user): Promise<UserPublicProfile> {
        this.logger.log('User is: ' + JSON.stringify(user));
        return this.userService.loadUser(user.uid);
    }

    @Get()
    getHelloByName() {
        // Forwards the name to our hello service, and returns the results
        this.logger.log('Got request');
        return "hello";
    }
}
