import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserRequest, User, TypeAccount, UserData, UserStatus } from '@pokehub/user';
import * as bcrypt from 'bcrypt';
import { UserStatusService } from './user-status.service';

@Injectable()
export class UserService {

  private readonly logger = new Logger(UserService.name);

  constructor(@InjectRepository(User) private usersRepository: Repository<User>, private userStatusService: UserStatusService) {}

  async createUser(userReq: CreateUserRequest): Promise<UserData> {
    const user = this.usersRepository.create();
    this.populateNewUserFromReq(user, userReq);
    const userData: UserData = await this.createUserInternal(user);
    await this.userStatusService.upsertLastSeen(userData.uid, new Date());
    this.logger.log('Sending newly created user back');
    return userData;
  }

  async createOrFindGoogleOAuthUser(userReq: CreateUserRequest): Promise<UserData> {
      const user = this.usersRepository.create();
      this.logger.log("Trying to find user: ", userReq.email);
      user.username = `user-${user.uid}`;
      this.populateNewGoogleOAuthUserFromReq(user, userReq);
      const userDB: User = await this.findUserByEmail(user.email);
      this.logger.debug("Google User from DB: " + JSON.stringify(userDB));
      if (userDB && userDB.account === TypeAccount.GOOGLE) {
          const userData = new UserData(userDB.uid, userDB.email, userDB.username, userDB.firstName, userDB.lastName, userDB.account, userDB.emailVerified);
          return userData;
      }
      else if (userDB && userDB.account === TypeAccount.REGULAR) throw new RpcException('An account with this already exists. Please login with your account credentials');
      
      return await this.createUserInternal(user);
  }

  async findUser(uid: string): Promise<UserData> {
      try {
          const user: User = await this.usersRepository.findOne(uid);
          return new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified);
      } catch (err) {
        throw new RpcException("Internal Server Error");
      }
  }

  async findUserByEmail(email: string): Promise<User> {
      try {
          const user = await this.usersRepository.createQueryBuilder("user")
            .where("email = :email", { email })
            .getOne();
          this.logger.log('Fetched user: ' + JSON.stringify(user));
          this.logger.debug('Fetched User UID: ' + user.uid);
          return user;
      } catch (err) {
          this.logger.error(`Received error: ${err}`);
          throw new RpcException('Internal Server Error');
      }
  }

  async findUserByUsername(username: string): Promise<User> {
      try {
          const user = await this.usersRepository.createQueryBuilder("user")
            .where("username = :username", { username })
            .getOne()
          this.logger.log('Fetched user: ' + JSON.stringify(user));
          return user;
      } catch (err) {
          this.logger.error(`Received error: ${err}`);
          throw new RpcException('Internal Server Error');
      }
  }

  private async createUserInternal(user: User): Promise<UserData> {
    let response: UserData = null;
    const salt = await bcrypt.genSalt();
    this.logger.log('User is ' + JSON.stringify(user));
    this.logger.log('Salt is ' + salt);
    user.password = await bcrypt.hash(user.password, salt);
    try {
      const result = await this.usersRepository.insert(user);
      this.logger.log(`Got result from createUser: ${result}`);
      response = new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified);
    } catch (err) {
      if (err.message.includes('duplicate key')) {
        if (err.detail.includes('email')) throw new RpcException('This email already exists');
        else if (err.detail.includes('username')) throw new RpcException('This username already exists');
        throw new RpcException(err.message);
      }
      throw new RpcException(err.message);
    }
    this.logger.log('Sending newly created user back');
    return response;
  }

  private populateNewUserFromReq(user: User, userReq: CreateUserRequest): void {
    user.email = userReq.email;
    user.username = userReq.username;
    user.password = userReq.password;
    user.firstName = user.firstName;
    user.lastName = user.lastName;
    user.account = TypeAccount.REGULAR;
  }

  private populateNewGoogleOAuthUserFromReq(user: User, userReq: CreateUserRequest): void {
      this.populateNewUserFromReq(user, userReq);
      user.account = TypeAccount.GOOGLE;
      user.emailVerified = true;
  }
}
