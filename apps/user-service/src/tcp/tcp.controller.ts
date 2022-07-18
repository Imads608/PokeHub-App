import { Controller, Inject, UsePipes } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { IUserService, IUserStatusService, USER_SERVICE, USER_STATUS_SERVICE, } from '@pokehub/user/database';
import { ValidationPipe } from './validation.pipe';
import { AppLogger } from '@pokehub/common/logger';
import { EmailLogin } from '@pokehub/auth/models';
import { UserIdTypes } from '@pokehub/user/interfaces';
import { CreateUserRequest, UserData, UserPublicData, UserStatusData } from '@pokehub/user/models';
import { UserServiceTCPEndpoints } from '@pokehub/user/endpoints';
import { IUtilsService, UTILS_SERVICE } from '../common/utils-interface.service';

@Controller()
export class TcpUserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: IUserService,
    @Inject(USER_STATUS_SERVICE) private readonly userStatusService: IUserStatusService,
    @Inject(UTILS_SERVICE) private readonly utilsService: IUtilsService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(TcpUserController.name);
  }

  @UsePipes(new ValidationPipe())
  @MessagePattern({ cmd: UserServiceTCPEndpoints.CREATE_USER }, Transport.TCP)
  async createUser(createReq: CreateUserRequest): Promise<UserData> {
    this.logger.log('createUser: Got request to create user');
    const data: UserData = await this.userService.createUser(createReq);
    return data;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.GOOGLE_OAUTH_LOGIN }, Transport.TCP)
  async googleOAuthLogin(createUser: CreateUserRequest): Promise<UserData> {
    this.logger.log('googleOAuthLogin: Got request to login user with Google');
    const user = await this.userService.createOrFindGoogleOAuthUser(createUser);
    if (user.avatar)
    this.utilsService.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.GET_PUBLIC_USER })
  async getPublicUser(uid: string): Promise<UserPublicData> {
    this.logger.log(`getPublicUser: Got request to retrieve Public Details of User ${uid}`);
    const userData = await this.userService.findUser(uid);
    this.utilsService.populateAvatarURL(userData);
    return userData;
    //return new UserPublicData(uid, userData.username, userData.emailVerified, userData.avatarUrl);
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.FIND_USER }, Transport.TCP)
  async findUser(uid: string): Promise<UserData> {
    this.logger.log(`findUser: Got request to find user ${uid}`);
    const user = await this.userService.findUser(uid);
    this.utilsService.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.FIND_USER_EMAIL }, Transport.TCP)
  async findUserByEmail(email: string): Promise<UserData> {
    this.logger.log( `findUserByEmail: Got request to find user with email ${email}` );
    const user = await this.userService.findUserByEmail(email);
    this.utilsService.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.FIND_USER_USERNAME }, Transport.TCP)
  async findUserByUsername(username: string): Promise<UserData> {
    this.logger.log( `findUserByUsername: Got request to find user by username ${username}` );
    const user = await this.userService.findUserByUsername(username);
    this.utilsService.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.GET_USER_STATUS }, Transport.TCP)
  async getUserStatus(id: string): Promise<UserStatusData> {
    this.logger.log( `getUserStatus: Got request to get User Status with id ${id}` );
    return this.userStatusService.getUserStatus(id);
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.VERIFY_USER_EMAIL }, Transport.TCP)
  async verifyUserEmail(userId: string): Promise<UserData> {
    this.logger.log( `verifyUserEmail: Got request to update Email Address Verification of User ${userId}` );
    return this.userService.validateUserEmail(userId);
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.CHECK_EMAIL_EXISTS }, Transport.TCP)
  async checkEmailExists(email: string): Promise<boolean> {
    this.logger.log( `checkEmailExists: Got request to check if Email ${email} exists`);
    return this.userService.doesEmailExist(email);
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.CHECK_USER_EXISTS }, Transport.TCP)
  async checkUserExists(user: { userId: string, idType: UserIdTypes}): Promise<boolean> {
    this.logger.log( `checkEmailExists: Got request to check if User with id exists: ${user.userId}`);
    if (user.idType === UserIdTypes.EMAIL) {
      return await this.userService.doesEmailExist(user.userId);
    } else if (user.idType === UserIdTypes.UID) {
      const data = await this.userService.findUser(user.userId);
      if (!data) return false;
      return true;
    }

    const data = await this.userService.findUserByUsername(user.userId);
    if (!data) return false;
    return true;
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.RESET_PASSWORD }, Transport.TCP)
  async updatePassword(userData: EmailLogin): Promise<UserData> {
    this.logger.log( `updatePassword: Got request to update password for user with email ${userData.email}`);
    return await this.userService.updatePassword(userData.email, userData.password);
  }

  @MessagePattern({ cmd: UserServiceTCPEndpoints.UPDATE_USER_DATA }, Transport.TCP)
  async updateUserData(userData: UserData): Promise<UserData> {
    this.logger.log(`updateUserData: Got request to update User Data for user with uid ${userData.uid}`);
    const user = await this.userService.updateUserData(userData);
    this.utilsService.populateAvatarURL(user);
    return user;
  }
}
