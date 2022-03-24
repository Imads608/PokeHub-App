/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from '@pokehub/common/logger';
import { UserStatusData } from '@pokehub/user/models';
import { IUserStatusData, Status } from '@pokehub/user/interfaces'
import { Repository } from 'typeorm';
import { IUserStatusService } from './user-status-service.interface';
import { UserStatus } from '@pokehub/user/database';

@Injectable()
export class UserStatusService implements IUserStatusService {
  constructor(@InjectRepository(UserStatus) private userStatusRepository: Repository<UserStatus>, private readonly logger: AppLogger) {
    this.logger.setContext(UserStatusService.name);
  }

  async upsertLastSeen(userId: string, lastSeen: Date): Promise<UserStatusData> {
    try {
      this.logger.log( `upsertLastSeen: Upserting Last Seen Status of ${lastSeen} for User ${userId}` );
      const userStatus = this.userStatusRepository.create();
      userStatus.lastSeen = lastSeen;
      const res = await this.userStatusRepository.save(userStatus);
      this.logger.log( `upsertLastSeen: Successfully updated Last Seen Status for User ${userId}` );
      return res;
    } catch (err) {
      this.logger.error( `upsertLastSeen: Got error saving last seen for user ${userId}: ${err}` );
      throw err;
    }
  }

  async createStatusForNewUser(): Promise<UserStatusData> {
    try {
      this.logger.log(`createStatusForNewUser: Creating Status`);
      const userStatus = this.userStatusRepository.create();
  
      userStatus.lastSeen = new Date();
      userStatus.state = Status.ONLINE;
      await this.userStatusRepository.save(userStatus);
      this.logger.log(`createStatusForNewUser: Successfully created Status entry`);
      return userStatus;
    } catch (err) {
      this.logger.error(`createStatusForNewUser: Got error while creating status: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async updateUserStatus(status: UserStatus): Promise<UserStatusData> {
    try {
      this.logger.log(`updateUserStatus: Starting to update User Status`);
      const updatedStatus: UserStatus = await this.userStatusRepository.createQueryBuilder()
        .update(status)
        .set({ lastSeen: status.lastSeen, state: status.state })
        .where('id = :id', { id: status.id })
        .andWhere('status not in (:...statuses)', { statuses: [Status.APPEAR_AWAY, Status.APPEAR_BUSY, Status.APPEAR_OFFLINE] })
        .returning('*')
        .execute()
        .then((res) => res.raw[0]);

      return updatedStatus;
    } catch (err) {
      this.logger.error(`updateUserStatus: Got error while trying to update User Status: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async updateHardUserStatus(status: UserStatus): Promise<UserStatusData> {
    try {
      this.logger.log(`updateHardUserStatus: Starting to update User Status: ${JSON.stringify(status)}`);
      const currStatus = await this.userStatusRepository.findOne(status.id);
      currStatus.lastSeen = status.lastSeen;
      currStatus.state = status.state;
      await this.userStatusRepository.save(currStatus);
      //const updatedStatus = await this.userStatusRepository.save(status);
      return currStatus;
    } catch (err) {
      this.logger.error(`updateHardUserStatus: Got error while trying to update User Status: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async getUserStatus(userId: string): Promise<UserStatusData> {
    try {
      this.logger.log(`getLastSeenOfUser: Fetching Last Seen Status of User`);
      const userStatus: UserStatus = await this.userStatusRepository.findOne( userId );
      const data = new UserStatusData(
        userStatus.id,
        userStatus.state,
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
