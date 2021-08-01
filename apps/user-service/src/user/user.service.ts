import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserRequest, User, TypeAccount, UserData } from '@pokehub/user';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

  private readonly logger = new Logger(UserService.name);

  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  async createUser(userReq: CreateUserRequest): Promise<UserData> {
    const user = this.usersRepository.create();
    this.populateNewUserFromReq(user, userReq);
    let response: UserData = null;
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(userReq.password, salt);
    try {
      const result = await this.usersRepository.insert(user);
      this.logger.log(`Got result from createUser: ${result}`);
      response = new UserData(user.uid, user.email, user.username, user.firstName, user.lastName, user.account);
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

  async findUser(username: string): Promise<User> {
    try {
      const user = await this.usersRepository.createQueryBuilder("user")
                    .where("username = :username", {username})
                    .getOne();
      this.logger.log('Fetched user: ' + user);
      if (!user) return null;
      return user;
    } catch (err) {
      this.logger.error(`Received error: ${err}`);
      throw new RpcException('Internal Server Error');
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  private populateNewUserFromReq(user: User, userReq: CreateUserRequest): void {
    user.email = userReq.email;
    user.username = userReq.username;
    user.password = userReq.password;
    user.firstName = user.firstName;
    user.lastName = user.lastName;
    user.account = TypeAccount.REGULAR;
  }
}
