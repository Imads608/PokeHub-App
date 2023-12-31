import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { AppLogger } from '@pokehub/common/logger';
import { EmailLogin } from '@pokehub/auth/models';
import { UserIdTypes } from '@pokehub/user/interfaces';
import { CreateUserRequest, UserData, UserPublicData, UserStatusData } from '@pokehub/user/models';
import { UserServiceTCPEndpoints } from '@pokehub/user/endpoints';
import { IUserService, USER_SERVICE } from './user-service.interface';

@Controller()
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: IUserService, private readonly logger: AppLogger) {
    this.logger.setContext(UserController.name);
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.CREATE_USER }, Transport.TCP)
  async createUser(createReq: CreateUserRequest): Promise<UserData> {
    this.logger.log('createUser: Got request to create user');
    const res = await this.userService.createUser(createReq);
    this.logger.log(`createUser: Successfully created User in the database`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.GOOGLE_OAUTH_LOGIN }, Transport.TCP)
  async googleOAuthLogin(createUser: CreateUserRequest): Promise<UserData> {
    this.logger.log('googleOAuthLogin: Got request to login user with Google');
    const res = await this.userService.googleOAuthLogin(createUser);
    this.logger.log(`googleOAuthLogin: Successfully got result`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.GET_PUBLIC_USER })
  async getPublicUser(uid: string): Promise<UserPublicData> {
    this.logger.log(`getPublicUser: Got request to retrieve Public Details of User ${uid}`);
    const res = await this.userService.getPublicUser(uid);
    this.logger.log(`getPublicUser: Successfully got details for User ${uid}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.FIND_USER }, Transport.TCP)
  async findUser(uid: string): Promise<UserData> {
    this.logger.log(`findUser: Got request to find user ${uid}`);
    const res = await this.userService.findUser(uid);
    this.logger.log(`findUser: Successfully got result for user ${uid}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.FIND_USER_EMAIL }, Transport.TCP)
  async findUserByEmail(email: string): Promise<UserData> {
    this.logger.log( `findUserByEmail: Got request to find user with email ${email}` );
    const res = await this.userService.findUserByEmail(email);
    this.logger.log(`findUserByEmail: Successfully got result for user with email ${email}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.FIND_USER_USERNAME }, Transport.TCP)
  async findUserByUsername(username: string): Promise<UserData> {
    this.logger.log( `findUserByUsername: Got request to find user by username ${username}` );
    const res = await this.userService.findUserByUsername(username);
    this.logger.log(`findUserByUsername: Successfully got result for user with username ${username}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.GET_USER_STATUS }, Transport.TCP)
  async getUserStatus(id: string): Promise<UserStatusData> {
    this.logger.log( `getUserStatus: Got request to get User Status with id ${id}` );
    const res = await this.userService.getUserStatus(id);
    this.logger.log(`getUserStatus: Successfully got result for user status with id ${id}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.VERIFY_USER_EMAIL }, Transport.TCP)
  async verifyUserEmail(userId: string): Promise<UserData> {
    this.logger.log( `verifyUserEmail: Got request to update Email Address Verification of User ${userId}` );
    const res = await this.userService.verifyUserEmail(userId);
    this.logger.log(`verifyUserEmail: Successfully got result for User ${userId}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.CHECK_EMAIL_EXISTS }, Transport.TCP)
  async checkEmailExists(email: string): Promise<boolean> {
    this.logger.log( `checkEmailExists: Got request to check if Email ${email} exists`);
    const res = await this.userService.checkEmailExists(email);
    this.logger.log(`checkEmailExists: Successfully got result for user with Email ${email}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.CHECK_USER_EXISTS }, Transport.TCP)
  async checkUserExists(user: { userId: string, idType: UserIdTypes}): Promise<boolean> {
    this.logger.log( `checkEmailExists: Got request to check if User with id exists: ${user.userId}`);
    const res = await this.userService.checkUserExists(user);
    this.logger.log(`checkEmailExists: Successfully got result for user ${user.userId}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.RESET_PASSWORD }, Transport.TCP)
  async updatePassword(userData: EmailLogin): Promise<UserData> {
    this.logger.log( `updatePassword: Got request to update password for user with email ${userData.email}`);
    const res =  await this.userService.updatePassword(userData);
    this.logger.log(`updatePassword: Successfully got result for user with email ${userData.email}`);
    return res;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.UPDATE_USER_DATA }, Transport.TCP)
  async updateUserData(userData: UserData): Promise<UserData> {
    this.logger.log(`updateUserData: Got request to update User Data for user with uid ${userData.uid}`);
    const res = await this.userService.updateUserData(userData);
    this.logger.log(`updateUserData: Successfully got result for user with uid ${userData.uid}`);
    return res;
  }
}
