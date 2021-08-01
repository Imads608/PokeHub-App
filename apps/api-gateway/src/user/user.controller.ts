import { BadRequestException, Body, Controller, Get, HttpStatus, Logger, Param, Post, Res, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { CreateUserRequest, UserDataWithToken } from '@pokehub/user';
import { CreateUserInterceptor } from './create-user.interceptor';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(private readonly userService: UserService) {}

    @UseInterceptors(CreateUserInterceptor)
    @Post()
    create(@Body() createUserData: CreateUserRequest): Promise<UserDataWithToken> {
        this.logger.log('Got request to create user with username: ' + createUserData.username);
        return this.userService.createUser2(createUserData);        
    }

    @Get()
    getHelloByName() {
        // Forwards the name to our hello service, and returns the results
        this.logger.log('Got request');
        return "hello";
    }
}
