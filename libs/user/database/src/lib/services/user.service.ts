import { Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserRequest, UserData } from '@pokehub/user/models';
import * as bcrypt from 'bcrypt';
import { AppLogger } from '@pokehub/common/logger';
import { IUserService } from './user-service.interface';
import { IUserStatusService, USER_STATUS_SERVICE, } from './user-status-service.interface';
import { User } from '../entities/user.entity';
import { UserStatus } from '../entities/user-status.entity';
import { TypeAccount } from '@pokehub/user/interfaces';
import { BucketDetails } from '@pokehub/common/object-store/models';
import { UsernameGeneratorService } from '../utils/username-gen.service';
import { uuid } from 'uuidv4';

@Injectable()
export class UserService implements IUserService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>, private readonly usernameGenService: UsernameGeneratorService,
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
      return (await this.findUserByEmail(email)) as UserData;
    } catch (err) {
      this.logger.error(`updatePassword: Got error updating Password for user ${email}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async updateAvatar(userId: string, avatar: BucketDetails): Promise<UserData> {
    try {
      this.logger.log(`updateAvatar: Updating Avatar for user ${userId}`);
      const user: User = await this.usersRepository.save({
        uid: userId,
        avatar
      })
      this.logger.log(`updateAvatar: Successfully updated Avatar for user ${userId}`);
      return this.createUserDataFromEntity(user, false);
    } catch (err) {
      this.logger.error(`updateAvatar: Got error while updating Avatar for user ${userId}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async updateUserData(userData: UserData): Promise<UserData> {
    try {
      this.logger.log(`updateUserData: Updating User Data with uid ${userData.uid}`);
      const user = userData as User;
      const dbUser = await this.findUser(user.uid);
      if (!dbUser)
        throw new Error(`No user found with uid ${user.uid}`);
      if (dbUser.username !== user.username) {
        user.countUsernameChanged++;
      }

      user.password = dbUser.password as string;
      const updatedUser = await this.usersRepository.save(user);
      this.logger.log(`updateUserData: Successfully updated User Data with uid ${userData.uid}`);
      return this.createUserDataFromEntity(updatedUser, false);
    } catch (err) {
      this.logger.error(`updateUserData: Got error while updating User with uid ${userData.uid}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async validateUserEmail(userId: string): Promise<UserData> {
    try {
      const user: User = await this.usersRepository.save({
        uid: userId,
        emailVerified: true,
      });

      return this.createUserDataFromEntity(user, false);
    } catch (err) {
      this.logger.error( `validateUserEmail: Got error updating Email Validation of User ${userId}: ${JSON.stringify( err )}` );
      throw err;
    }
  }

  async createUser(userReq: CreateUserRequest): Promise<UserData> {
    this.logger.log(`createUser: Creating new User with username: ${userReq.username}`);
    const user = this.usersRepository.create();
    this.populateNewUserFromReq(user, userReq);
    const status = await this.createUserStatus();
    user.status = status;

    const userData: UserData = await this.createUserInternal(user);

    this.logger.log('createUser: Sending newly created user back');
    return userData;
  }

  async createOrFindGoogleOAuthUser( userReq: CreateUserRequest ): Promise<UserData> {
    // Initialize new User
    const user = this.usersRepository.create();

    this.logger.log( `createOrFindGoogleOAuthUser: Trying to find user with email ${userReq.email}` );
    
    // Randomly generate Username
    if (userReq.firstName && userReq.lastName)
      userReq.username = this.usernameGenService.generateWithName(userReq.firstName, userReq.lastName);
    else
      userReq.username = this.usernameGenService.generateWithoutName();
    
    // Populate Object from Request
    this.populateNewGoogleOAuthUserFromReq(user, userReq);

    // Check if User Already exists
    const userData = await this.findUserByEmail(user.email);

    // Return User if Account Type is Google otherwise throw and error
    if (userData && userData.account === TypeAccount.GOOGLE) {
      return userData;
    } else if (userData && userData.account === TypeAccount.REGULAR)
      throw new RpcException( 'An account with this email already exists. Please login with your account credentials' );

    // Create User Status
    user.status = await this.createUserStatus();

    // Create and Return User if not existing
    return await this.tryCreateOAuthUsername(user);
  }

  async findUser(uid: string): Promise<UserData | null> {
    try {
      this.logger.log(`findUser: Finding user with uid ${uid}`);
      const user = await this.usersRepository.findOne({ where: { uid }, relations: [ "status" ]});
      if (user) {
        this.logger.log(`findUser: Successfully found user with uid ${uid}`);
        return this.createUserDataFromEntity(user, true);
      }
      this.logger.log(`findUser: No User found with uid ${uid}`);
      return null;
    } catch (err) {
      this.logger.error( `findUser: Got error while trying to find user with uid ${uid}: ${err}` );
      throw err;
    }
  }

  async findUserByEmail(email: string): Promise<UserData | null> {
    try {
      this.logger.log(`findUserByEmail: Finding user with email: ${email}`);
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('email = :email', { email })
        .leftJoinAndSelect("user.status", "status")
        .getOne();
      if (user) {
        this.logger.log( `findUserByEmail: Successfully found user with email ${email}` );
        return this.createUserDataFromEntity(user, true);
      }
      this.logger.log(`findUserByEmail: No User found with email ${email}`);
      return null;
    } catch (err) {
      this.logger.error( `findUserByEmail: Got error while trying to find user with email ${email}: ${err}` );
      throw err;
    }
  }

  async findUserByUsername(username: string): Promise<UserData | null> {
    try {
      this.logger.log( `findUserByUsername: Finding user with username: ${username}` );
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('username = :username', { username })
        .leftJoinAndSelect("user.status", "status")
        .getOne();
      if (user) {
        this.logger.log( `findUserByUsername: Successfully found user with username ${username}` );
        return this.createUserDataFromEntity(user, true);
      }
      this.logger.log( `findUserByUsername: No User found with username ${username}` );
      return null;
    } catch (err) {
      this.logger.error( `findUserByUsername: Got error while trying to find user with username ${username}: ${err}` );
      throw new RpcException('Internal Server Error');
    }
  }

  private async tryCreateOAuthUsername(user: User): Promise<UserData> {
    this.logger.log(`tryCreateOAuthUsername: Trying to create user with username ${user.username}`);
    let createdUser: UserData;
    let attempt = 0;

    while (attempt <= 4 && !createdUser) {
      try {
        createdUser = await this.createUserInternal(user);
      } catch (err) {
        if (err.message.includes("username already exists")) {
          this.logger.warn(`tryCreateOAuthUsername: Unable to create username ${user.username}. Going to try again with a different one: ${attempt}`);
          attempt++;
          if (user.firstName && user.lastName)
            user.username = this.usernameGenService.generateWithName(user.firstName, user.lastName);
          else
            user.username = this.usernameGenService.generateWithoutName();
        } else throw err;
      }
    }

    if (attempt > 4) {
      user.username = `user-${uuid()}`;
      createdUser = await this.createUserInternal(user);
    }

    return createdUser;
  }

  private async createUserInternal(user: User): Promise<UserData> {
    // Initialize Variables
    let response: UserData;

    this.logger.log( `createUserInternal: Creating new user with username ${user.username} and account type ${user.account}` );
    user.password = await this.hashPassword(user.password);

    // Create User
    try {
      const result = await this.usersRepository.insert(user);
      this.logger.log( `createUserInternal: Got result from createUser: ${result}` );
      response = this.createUserDataFromEntity(user, true);
    } catch (err) {
      this.logger.error( `createUserInternal: Got error while trying to insert new user: ${err}` );
      if ((err as any).message.includes('duplicate key')) {
        if ((err as any).detail.includes('email'))
          throw new Error('This email already exists');
        else if ((err as any).detail.includes('username'))
          throw new Error('This username already exists');
        throw new Error((err as any).message);
      }
      throw new Error((err as any).message);
    }
    this.logger.log('createUserInternal: Successfully created new user');
    return response;
  }

  private async createUserStatus(): Promise<UserStatus> {
    this.logger.log(`createUserStatus: Creating User Status Object`);
    const userStatusData = await this.userStatusService.createStatusForNewUser();
    return userStatusData as UserStatus;
  }

  private async hashPassword(passwordText: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(passwordText, salt);
  }

  private populateNewUserFromReq(user: User, userReq: CreateUserRequest): void {
    user.email = userReq.email;
    user.username = userReq.username;
    user.password = userReq.password;
    user.firstName = userReq.firstName || "";
    user.lastName = userReq.lastName || "";
    user.account = TypeAccount.REGULAR;
    user.emailVerified = userReq.emailVerified;
  }

  private populateNewGoogleOAuthUserFromReq( user: User, userReq: CreateUserRequest ): void {
    this.populateNewUserFromReq(user, userReq);
    user.account = TypeAccount.GOOGLE;
    user.emailVerified = true;
  }

  private createUserDataFromEntity(user: User, includePassword: boolean): UserData {
    return new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account, user.emailVerified, user.avatar, user.countUsernameChanged,
                        includePassword ? user.password : undefined, undefined, user.status);
  }
  
}
