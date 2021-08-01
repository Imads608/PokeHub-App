import { Controller, Get, Logger, UsePipes } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { CreateUserRequest, User, UserData } from '@pokehub/user';
import { ValidationPipe } from './validation.pipe';
import { UserService } from './user.service';

@Controller()
export class UserController {

  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @UsePipes(new ValidationPipe())
  @MessagePattern({ cmd: 'create-user' }, Transport.TCP)
  async createUser(createReq: CreateUserRequest): Promise<UserData> {
    this.logger.log('Got request to create user');
    const data: UserData = await this.userService.createUser(createReq);
    this.logger.log('Done creating user');
    return data;
  }

  @MessagePattern({ cmd: 'find-user' }, Transport.TCP)
  async findUser(username: string): Promise<User> {
    this.logger.log('Got request to find user');
    return this.userService.findUser(username);
  }
}
