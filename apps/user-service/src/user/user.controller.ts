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

  @MessagePattern({ cmd: 'google-oauth-login' }, Transport.TCP)
  async googleOAuthLogin(createUser: CreateUserRequest): Promise<UserData> {
      this.logger.log('Got request to login user with Google');
      return await this.userService.createOrFindGoogleOAuthUser(createUser);
  }

  @MessagePattern({ cmd: 'find-user' }, Transport.TCP)
  async findUser(uid: string): Promise<User> {
    this.logger.log('Got request to find user', JSON.stringify(uid));
    return this.userService.findUser(uid);
  }

  @MessagePattern({ cmd: 'find-user-email' }, Transport.TCP)
  async findUserByEmail(email: string): Promise<User> {
      this.logger.log('Got request to find user by email ' + email);
      return this.userService.findUserByEmail(email);
  }

  @MessagePattern({ cmd: 'find-user-username' }, Transport.TCP)
  async findUserByUsername(username: string): Promise<User> {
      this.logger.log('Got request to find user by username ' + username);
      return this.userService.findUserByUsername(username);
  }
}
