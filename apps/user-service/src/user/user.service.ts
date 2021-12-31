import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserRequest, User, TypeAccount, UserData } from '@pokehub/user';
import * as bcrypt from 'bcrypt';
import { AppLogger } from '@pokehub/logger';
import { IUserService } from './user-service.interface';
import { IUserStatusService, USER_STATUS_SERVICE, } from './user-status-service.interface';

@Injectable()
export class UserService implements IUserService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>,
              @Inject(USER_STATUS_SERVICE) private userStatusService: IUserStatusService, private readonly logger: AppLogger) {
    this.logger.setContext(UserService.name);
  }

  async doesEmailExist(email: string): Promise<boolean> {
    try {
      const userData = await this.findUserByEmail(email);
      if (userData) return true;
      return false;
    } catch (err) {
      this.logger.error(`doesEmailExist: Got error while checking if User with Email Exists: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async updatePassword(email: string, newPassword: string): Promise<UserData> {
    try {
      // Hashing Password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update Password
      this.logger.log(`updatePassword: Updating Password for user ${email}`);
      await this.usersRepository.update({ email }, { password: hashedPassword });
      this.logger.log(`updatePassword: Successfully updated Password for user ${email}`);
      return await this.findUserByEmail(email);
    } catch (err) {
      this.logger.error(`updatePassword: Got error updating Password for user ${email}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async validateUserEmail(userId: string): Promise<UserData> {
    try {
      const user: User = await this.usersRepository.save({
        uid: userId,
        emailVerified: true,
      });

      return new UserData( user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified, user.countUsernameChanged );
    } catch (err) {
      this.logger.error( `validateUserEmail: Got error updating Email Validation of User ${userId}: ${JSON.stringify( err )}` );
      throw err;
    }
  }

  async createUser(userReq: CreateUserRequest): Promise<UserData> {
    const user = this.usersRepository.create();
    this.populateNewUserFromReq(user, userReq);

    const userData: UserData = await this.createUserInternal(user);
    await this.userStatusService.upsertLastSeen(userData.uid, new Date());

    this.logger.log('createUser: Sending newly created user back');
    return userData;
  }

  async createOrFindGoogleOAuthUser( userReq: CreateUserRequest ): Promise<UserData> {
    // Initialize new User
    const user = this.usersRepository.create();

    // Check if User already exists
    this.logger.log( `createOrFindGoogleOAuthUser: Trying to find user with email ${userReq.email}` );
    user.username = `user-${user.uid}`;
    this.populateNewGoogleOAuthUserFromReq(user, userReq);
    const userDB: User = await this.findUserByEmail(user.email);

    // Return User if Account Type is Google otherwise throw and error
    if (userDB && userDB.account === TypeAccount.GOOGLE) {
      const userData = new UserData( userDB.uid, userDB.email, userDB.username, userDB.firstName, userDB.lastName, userDB.account, userDB.emailVerified, userDB.countUsernameChanged );
      return userData;
    } else if (userDB && userDB.account === TypeAccount.REGULAR)
      throw new RpcException( 'An account with this already exists. Please login with your account credentials' );

    // Create and Return User if not existing
    return await this.createUserInternal(user);
  }

  async findUser(uid: string): Promise<UserData> {
    try {
      this.logger.log(`findUser: Finding user with uid ${uid}`);
      const user: User = await this.usersRepository.findOne(uid);
      if (user) {
        this.logger.log(`findUser: Successfully found user with uid ${uid}`);
        return new UserData( user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified, user.countUsernameChanged, user.password );
      }
      this.logger.log(`findUser: No User found with uid ${uid}`);
      return null;
    } catch (err) {
      this.logger.error( `findUser: Got error while trying to find user with uid ${uid}: ${err}` );
      throw new RpcException('Internal Server Error');
    }
  }

  async findUserByEmail(email: string): Promise<UserData> {
    try {
      this.logger.log(`findUserByEmail: Finding user with email: ${email}`);
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('email = :email', { email })
        .getOne();
      if (user) {
        this.logger.log( `findUserByEmail: Successfully found user with email ${email}` );
        return new UserData( user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified, user.countUsernameChanged, user.password );
      }
      this.logger.log(`findUserByEmail: No User found with email ${email}`);
      return null;
    } catch (err) {
      this.logger.error( `findUserByEmail: Got error while trying to find user with email ${email}: ${err}` );
      throw new RpcException('Internal Server Error');
    }
  }

  async findUserByUsername(username: string): Promise<UserData> {
    try {
      this.logger.log( `findUserByUsername: Finding user with username: ${username}` );
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('username = :username', { username })
        .getOne();
      if (user) {
        this.logger.log( `findUserByUsername: Successfully found user with username ${username}` );
        return new UserData( user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified, user.countUsernameChanged, user.password );
      }
      this.logger.log( `findUserByUsername: No User found with username ${username}` );
      return null;
    } catch (err) {
      this.logger.error( `findUserByUsername: Got error while trying to find user with username ${username}: ${err}` );
      throw new RpcException('Internal Server Error');
    }
  }

  private async createUserInternal(user: User): Promise<UserData> {
    // Initialize Variables
    let response: UserData = null;

    this.logger.log( `createUserInternal: Creating new user with username ${user.username} and account type ${user.account}` );
    user.password = await this.hashPassword(user.password);

    // Create User
    try {
      const result = await this.usersRepository.insert(user);
      this.logger.log( `createUserInternal: Got result from createUser: ${result}` );
      response = new UserData( user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified, user.countUsernameChanged, user.password );
    } catch (err) {
      this.logger.error( `createUserInternal: Got error while trying to insert new user: ${err}` );
      if (err.message.includes('duplicate key')) {
        if (err.detail.includes('email'))
          throw new RpcException('This email already exists');
        else if (err.detail.includes('username'))
          throw new RpcException('This username already exists');
        throw new RpcException(err.message);
      }
      throw new RpcException(err.message);
    }
    this.logger.log('createUserInternal: Successfully created new user');
    return response;
  }

  private async hashPassword(passwordText: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(passwordText, salt);
  }

  private populateNewUserFromReq(user: User, userReq: CreateUserRequest): void {
    user.email = userReq.email;
    user.username = userReq.username;
    user.password = userReq.password;
    user.firstName = userReq.firstName;
    user.lastName = userReq.lastName;
    user.account = TypeAccount.REGULAR;
  }

  private populateNewGoogleOAuthUserFromReq( user: User, userReq: CreateUserRequest ): void {
    this.populateNewUserFromReq(user, userReq);
    user.account = TypeAccount.GOOGLE;
    user.emailVerified = true;
  }
}
