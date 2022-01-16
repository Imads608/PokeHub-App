/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from '@pokehub/common/logger';
import { UserStatusData } from '@pokehub/user/models';
import { IUserStatusData } from '@pokehub/user/interfaces'
import { Repository } from 'typeorm';
import { IUserStatusService } from './user-status-service.interface';
import { UserStatus } from '@pokehub/user/database';

@Injectable()
export class UserStatusService implements IUserStatusService {
  constructor(
    @InjectRepository(UserStatus)
    private userStatusRepository: Repository<UserStatus>,
    private readonly logger: AppLogger
  ) {}

  async upsertLastSeen(userId: string, lastSeen: Date): Promise<void> {
    try {
      this.logger.log(
        `upsertLastSeen: Upserting Last Seen Status of ${lastSeen} for User ${userId}`
      );
      const userStatus = this.userStatusRepository.create();
      userStatus.uid = userId;
      userStatus.lastSeen = lastSeen;
      await this.userStatusRepository.save(userStatus);
      this.logger.log(
        `upsertLastSeen: Successfully updated Last Seen Status for User ${userId}`
      );
    } catch (err) {
      this.logger.error(
        `upsertLastSeen: Got error saving last seen for user ${userId}: ${err}`
      );
      throw err;
    }
  }

  async getLastSeenOfUser(userId: string): Promise<IUserStatusData> {
    try {
      this.logger.log(`getLastSeenOfUser: Fetching Last Seen Status of User`);
      const userStatus: UserStatus = await this.userStatusRepository.findOne(
        userId
      );
      const data = new UserStatusData(
        userStatus.uid,
        userStatus.status,
        userStatus.lastSeen
      );
      this.logger.log(
        `getLastSeenOfUser: Successfully fetched Last Seen Data of user ${userId}: ${JSON.stringify(
          data
        )}`
      );
      return data;
    } catch (err) {
      this.logger.error(
        `getLastSeenOfUser: Got error getting last seen data of user ${userId}: ${err}`
      );
      throw err;
    }
  }
}
