import { Controller, Inject, UsePipes } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import {
  CreateUserRequest,
  User,
  UserData,
  UserStatus,
  TCPEndpoints,
} from '@pokehub/user';
import { ValidationPipe } from './validation.pipe';
import { AppLogger } from '@pokehub/logger';
import { IUserService, USER_SERVICE } from './user-service.interface';
import {
  IUserStatusService,
  USER_STATUS_SERVICE,
} from './user-status-service.interface';

@Controller()
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: IUserService,
    @Inject(USER_STATUS_SERVICE)
    private readonly userStatusService: IUserStatusService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(UserController.name);
  }

  @UsePipes(new ValidationPipe())
  @MessagePattern({ cmd: TCPEndpoints.CREATE_USER }, Transport.TCP)
  async createUser(createReq: CreateUserRequest): Promise<UserData> {
    this.logger.log('createUser: Got request to create user');
    const data: UserData = await this.userService.createUser(createReq);
    return data;
  }

  @MessagePattern({ cmd: TCPEndpoints.GOOGLE_OAUTH_LOGIN }, Transport.TCP)
  async googleOAuthLogin(createUser: CreateUserRequest): Promise<UserData> {
    this.logger.log('googleOAuthLogin: Got request to login user with Google');
    return await this.userService.createOrFindGoogleOAuthUser(createUser);
  }

  @MessagePattern({ cmd: TCPEndpoints.FIND_USER }, Transport.TCP)
  async findUser(uid: string): Promise<UserData> {
    this.logger.log(`findUser: Got request to find user ${uid}`);
    return this.userService.findUser(uid);
  }

  @MessagePattern({ cmd: TCPEndpoints.FIND_USER_EMAIL }, Transport.TCP)
  async findUserByEmail(email: string): Promise<User> {
    this.logger.log(
      `findUserByEmail: Got request to find user with email ${email}`
    );
    return this.userService.findUserByEmail(email);
  }

  @MessagePattern({ cmd: TCPEndpoints.FIND_USER_USERNAME }, Transport.TCP)
  async findUserByUsername(username: string): Promise<User> {
    this.logger.log(
      `findUserByUsername: Got request to find user by username ${username}`
    );
    return this.userService.findUserByUsername(username);
  }

  @MessagePattern({ cmd: TCPEndpoints.GET_USER_STATUS }, Transport.TCP)
  async getUserStatus(userId: string): Promise<UserStatus> {
    this.logger.log(
      `getUserStatus: Got request to get User Status with id ${userId}`
    );
    return this.userStatusService.getLastSeenOfUser(userId);
  }

  @MessagePattern({ cmd: TCPEndpoints.VERIFY_USER_EMAIL }, Transport.TCP)
  async verifyUserEmail(userId: string): Promise<UserData> {
    this.logger.log(
      `verifyUserEmail: Got request to update Email Address Verification of User ${userId}`
    );
    return this.userService.validateUserEmail(userId);
  }
}
