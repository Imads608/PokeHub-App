import { BadRequestException, Controller, Get, Inject, InternalServerErrorException, Param, Post, Res, UploadedFile, UseInterceptors, UsePipes } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { User, UserStatus, } from '@pokehub/user/database';
import { ValidationPipe } from './validation.pipe';
import { AppLogger } from '@pokehub/common/logger';
import { IUserService, USER_SERVICE } from '../common/user-service.interface';
import { IUserStatusService, USER_STATUS_SERVICE, } from '../common/user-status-service.interface';
import { EmailLogin } from '@pokehub/auth/models';
import { IUserData, Status, TCPEndpoints, UserIdTypes } from '@pokehub/user/interfaces';
import { CreateUserRequest, UserData, UserDataWithStatus } from '@pokehub/user/models';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Multer } from 'multer';
import { S3_SERVICE, IS3Service } from '@pokehub/common/object-store'
import { BucketDetails, PutObjectRequest, ObjectImageUrlRequest } from '@pokehub/common/object-store/models';
import { ConfigService } from '@nestjs/config';
import { ImageContentTypes } from '@pokehub/common/object-store/models';
import path = require('path');
import { UserPublicData } from '@pokehub/user/models';

@Controller('')
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: IUserService,
    @Inject(USER_STATUS_SERVICE) private readonly userStatusService: IUserStatusService,
    @Inject(S3_SERVICE) private readonly objectStoreService: IS3Service, private readonly configService: ConfigService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(UserController.name);
  }

  @UseInterceptors(FileInterceptor('avatar'))
  @Post(':userId/avatar')
  async updateUserAvatar(@UploadedFile() avatar: Express.Multer.File, @Param('userId') userId: string): Promise<UserData> {
    if (!userId || !avatar)
      throw new BadRequestException();
    try {
      // Save Avatar Image to Object Store
      this.logger.log(`updateUserAvatar: Got request to upload and save User avatar for ${userId}`);
      const putRequest = new PutObjectRequest(new BucketDetails(this.configService.get<string>('awsConfig.userBucketName'), 
                                              `${userId}/avatar`), 'avatar.png', avatar.buffer, ImageContentTypes.IMAGE_JPEG);
      await this.objectStoreService.putObject(putRequest);
      
      // Save Avatar Bucket Path to Database
      this.logger.log(`updateUserAvatar: Successfully updated the avatar in object store for user ${userId}`);
      putRequest.bucketInfo.objectPath += '/avatar.png';
      const user = await this.userService.updateAvatar(userId, putRequest.bucketInfo);
      
      // Populate URL and send back User Data
      this.populateAvatarURL(user);
      return user;
    } catch (err) {
      this.logger.error(`updateUserAvatar: Got error while updating User's avatar to Object Store and Database: ${JSON.stringify(err)}`);
      throw new InternalServerErrorException();
    }
  }

  @UsePipes(new ValidationPipe())
  @MessagePattern({ cmd: TCPEndpoints.CREATE_USER }, Transport.TCP)
  async createUser(createReq: CreateUserRequest): Promise<UserData> {
    this.logger.log('createUser: Got request to create user');
    const data: UserData = await this.userService.createUser(createReq);
    return data;
  }

  @MessagePattern({ cmd: TCPEndpoints.GOOGLE_OAUTH_LOGIN }, Transport.TCP)
  async googleOAuthLogin(createUser: CreateUserRequest): Promise<UserDataWithStatus> {
    this.logger.log('googleOAuthLogin: Got request to login user with Google');
    const user = await this.userService.createOrFindGoogleOAuthUser(createUser);
    this.populateAvatarURL(user);
    const status = await this.userStatusService.getUserStatus(user.uid);
    return new UserDataWithStatus(user, status);
  }

  @MessagePattern({ cmd: TCPEndpoints.GET_PUBLIC_USER })
  async getPublicUser(uid: string): Promise<UserDataWithStatus> {
    this.logger.log(`getPublicUser: Got request to retrieve Public Details of User ${uid}`);
    const userData = await this.userService.findUser(uid);
    this.populateAvatarURL(userData);
    const status = await this.userStatusService.getUserStatus(userData.uid);
    return new UserDataWithStatus(userData, status);
    //return new UserPublicData(uid, userData.username, userData.emailVerified, userData.avatarUrl);
  }

  @MessagePattern({ cmd: TCPEndpoints.FIND_USER }, Transport.TCP)
  async findUser(uid: string): Promise<UserData> {
    this.logger.log(`findUser: Got request to find user ${uid}`);
    const user = await this.userService.findUser(uid);
    this.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: TCPEndpoints.LOAD_USER_WITH_STATUS}, Transport.TCP)
  async loadUserWithStatus(uid: string): Promise<UserDataWithStatus> {
    this.logger.log(`loadUserWithStatus: Got request to load user with uid ${uid}`);
    const user = await this.userService.findUser(uid);
    this.populateAvatarURL(user);
    const status = await this.userStatusService.updateUserStatus({ lastSeen: new Date(), status: Status.ONLINE, uid: user.uid });
    return new UserDataWithStatus(user, status);
  }

  @MessagePattern({ cmd: TCPEndpoints.LOAD_USER_WITH_STATUS_BY_EMAIL}, Transport.TCP)
  async loadUserWithStatusByEmail(email: string): Promise<UserDataWithStatus> {
    this.logger.log(`loadUserWithStatusByEmail: Got request to load user with email ${email}`);
    const user = await this.userService.findUserByEmail(email);
    this.populateAvatarURL(user);
    const status = await this.userStatusService.updateUserStatus({ lastSeen: new Date(), status: Status.ONLINE, uid: user.uid });
    return new UserDataWithStatus(user, status);
  }

  @MessagePattern({ cmd: TCPEndpoints.LOAD_USER_WITH_STATUS_BY_USERNAME}, Transport.TCP)
  async loadUserWithStatusByUsername(username: string): Promise<UserDataWithStatus> {
    this.logger.log(`loadUserWithStatusByUsername: Got request to load user with username ${username}`);
    const user = await this.userService.findUserByUsername(username);
    this.populateAvatarURL(user);
    const status = await this.userStatusService.updateUserStatus({ lastSeen: new Date(), status: Status.ONLINE, uid: user.uid });
    return new UserDataWithStatus(user, status);
  }

  @MessagePattern({ cmd: TCPEndpoints.FIND_USER_EMAIL }, Transport.TCP)
  async findUserByEmail(email: string): Promise<UserData> {
    this.logger.log( `findUserByEmail: Got request to find user with email ${email}` );
    const user = await this.userService.findUserByEmail(email);
    this.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: TCPEndpoints.FIND_USER_USERNAME }, Transport.TCP)
  async findUserByUsername(username: string): Promise<UserData> {
    this.logger.log( `findUserByUsername: Got request to find user by username ${username}` );
    const user = await this.userService.findUserByUsername(username);
    this.populateAvatarURL(user);
    return user;
  }

  @MessagePattern({ cmd: TCPEndpoints.GET_USER_STATUS }, Transport.TCP)
  async getUserStatus(userId: string): Promise<UserStatus> {
    this.logger.log( `getUserStatus: Got request to get User Status with id ${userId}` );
    return this.userStatusService.getUserStatus(userId);
  }

  @MessagePattern({ cmd: TCPEndpoints.VERIFY_USER_EMAIL }, Transport.TCP)
  async verifyUserEmail(userId: string): Promise<UserData> {
    this.logger.log( `verifyUserEmail: Got request to update Email Address Verification of User ${userId}` );
    return this.userService.validateUserEmail(userId);
  }

  @MessagePattern({ cmd: TCPEndpoints.CHECK_EMAIL_EXISTS }, Transport.TCP)
  async checkEmailExists(email: string): Promise<boolean> {
    this.logger.log( `checkEmailExists: Got request to check if Email ${email} exists`);
    return this.userService.doesEmailExist(email);
  }

  @MessagePattern({ cmd: TCPEndpoints.CHECK_USER_EXISTS }, Transport.TCP)
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

  @MessagePattern({ cmd: TCPEndpoints.RESET_PASSWORD }, Transport.TCP)
  async updatePassword(userData: EmailLogin): Promise<UserData> {
    this.logger.log( `updatePassword: Got request to update password for user with email ${userData.email}`);
    return await this.userService.updatePassword(userData.email, userData.password);
  }

  @MessagePattern({ cmd: TCPEndpoints.UPDATE_USER_DATA }, Transport.TCP)
  async updateUserData(userData: UserData): Promise<UserData> {
    this.logger.log(`updateUserData: Got request to update User Data for user with uid ${userData.uid}`);
    const user = await this.userService.updateUserData(userData);
    this.populateAvatarURL(user);
    return user;
  }

  private populateAvatarURL(user: UserData): void {
    if (user.avatar != null) {
      const fileName = user.avatar.objectPath.substring(user.avatar.objectPath.lastIndexOf('/')+1);
      const objectPath = path.dirname(user.avatar.objectPath);
      user.avatarUrl = this.objectStoreService.getUrlForImageObject(new ObjectImageUrlRequest(new BucketDetails(user.avatar.bucketName, objectPath)
                                                                    , fileName, 900));
    }
  }
}
