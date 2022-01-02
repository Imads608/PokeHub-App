import { Inject, Injectable, InternalServerErrorException, UnauthorizedException, } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateUserRequest, UserDataWithToken, UserData, UserPublicProfile, TCPEndpoints, UserIdTypes, } from '@pokehub/user';
import { AuthTokens, EmailLogin, JwtTokenBody } from '@pokehub/auth';
import { ChatRoom } from '@pokehub/room';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { IRoomService, ROOM_SERVICE, } from '../chat/common/room-service.interface';
import { AppLogger } from '@pokehub/logger';
import { IUserService } from './user-service.interface';

@Injectable()
export class UserService implements IUserService {
  constructor(@Inject('UserMicroservice') private readonly clientProxy: ClientProxy,
              @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
              @Inject(ROOM_SERVICE) private readonly roomService: IRoomService, private readonly logger: AppLogger) {
    logger.setContext(UserService.name);
  }

  async loadUser(uid: string): Promise<UserPublicProfile> {
    try {
      this.logger.log(`loadUser: Loading User with uid ${uid}`);
      return await this.getUserData(uid);
    } catch (err) {
      this.logger.error(
        `loadUser: Got error while trying to load User with uid ${uid}: ${err}`
      );
      throw err;
    }
  }

  async doesUserExist(id: string, idType: UserIdTypes): Promise<boolean> {
    try {
      this.logger.log(`doesUserExist: Checking if User with Id ${id} exists`);
      const exists = await firstValueFrom(this.clientProxy.send<boolean>({ cmd: TCPEndpoints.CHECK_USER_EXISTS }, { userId: id, idType }));
      this.logger.log(`doesUserExist: Got response from User Microservice if User with Id ${id} exists: ${exists}`);
      return exists;
    } catch (err) {
      this.logger.error(`doesUserExist: Got error while trying to check if User with id ${id} exists: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async doesUserEmailExist(email: string): Promise<boolean> {
      try {
          this.logger.log(`doesUserExist: Checking if User with Email Exists Exists`);
          const exists = await firstValueFrom( this.clientProxy.send<boolean>({ cmd: TCPEndpoints.CHECK_EMAIL_EXISTS }, email) );
          this.logger.log(`doesUserExist: Got response from User Microservice if Email ${email} exists: ${exists}`);
          return exists;
      } catch (err) {
          this.logger.error(`doesUserExist: Got error while trying to check if User with ${email} exists: ${JSON.stringify(err)}`);
          throw err;
      }
  }

  async createUser(data: CreateUserRequest): Promise<UserDataWithToken> {
    try {
      // Create User
      this.logger.log( `createUser: Sending request to User Microservice to create User with email ${data.email}` );
      const user: UserData = await firstValueFrom( this.clientProxy.send<UserData>({ cmd: TCPEndpoints.CREATE_USER }, data) );
      if (!user) throw new InternalServerErrorException();

      this.logger.log( `createUser: Successfully created User with email ${data.email}. Going to create tokens through Auth Microservice` );

      // Create Tokens
      const tokens: AuthTokens = await this.authService.generateNewTokens( new JwtTokenBody(user.username, user.email, user.uid) );
      if (!tokens) throw new InternalServerErrorException();

      this.logger.log( `createUser: Successfully created tokens. Sending back User Data and Access and Refresh Tokens` );

      // Send back User and Tokens
      const response = new UserDataWithToken( user, tokens.accessToken, tokens.refreshToken );
      return response;
    } catch (err) {
      this.logger.error( `createUser: Got error while trying to create user with email ${data.email}: ${err}` );
      throw err;
    }
  }

  async activateUser(activationToken: string): Promise<UserData> {
    try {
      // Validate Activation Token
      this.logger.log(`activateUser: Going to validate Activation Token`);
      const data: JwtTokenBody = await this.authService.validateEmailConfirmationToken(activationToken);
      if (!data) throw new InternalServerErrorException();

      // Update Email Verification Status of User
      this.logger.log(`activateUser: Successfully decoded token into User Data: ${JSON.stringify(data)}`);
      const userData: UserData = await firstValueFrom(this.clientProxy.send({ cmd: TCPEndpoints.VERIFY_USER_EMAIL }, data.uid));
      if (!userData) throw new InternalServerErrorException();

      // Return User Data
      this.logger.log(`activateUser: Successfully updaed Email Verification Status of User ${userData.uid}`);
      return userData;
    } catch (err) {
      this.logger.error(`activateUser: Got error while trying to activate user: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async resetPassword(reset_token: string, newPassword: string): Promise<UserData> {
    try {
        
      // Validate Refresh Token
      this.logger.log(`resetPassword: Going to validate Password Reset Token`);
      const data: { email: string } = await this.authService.validatePasswordResetToken(reset_token);
      if (!data) throw new InternalServerErrorException();

      // Update Email Verification Status of User
      this.logger.log(`resetPassword: Successfully decoded token into User Data: ${JSON.stringify(data)}`);
      const userData: UserData = await firstValueFrom(this.clientProxy.send({ cmd: TCPEndpoints.RESET_PASSWORD }, new EmailLogin(data.email, newPassword)));
      if (!userData) throw new InternalServerErrorException();

      // Return User Data
      this.logger.log(`resetPassword: Successfully changed Password of User ${userData.uid}`);
      return userData;
    } catch (err) {
      this.logger.error(`resetPassword: Got error while trying to reset password of user: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  private async getUserData(uid: string): Promise<UserPublicProfile> {
    // Get User Details
    const userData: UserData = await firstValueFrom( this.clientProxy.send<UserData>({ cmd: TCPEndpoints.FIND_USER }, uid) );
    if (!userData) throw new InternalServerErrorException();

    // Get Joined Public Rooms
    const rooms: ChatRoom[] = await this.roomService.getJoinedPublicRoomsForUser(uid);

    // Get DMs
    return new UserPublicProfile(userData, rooms);
  }
}
