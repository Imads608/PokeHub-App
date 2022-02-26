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
      userStatus.uid = userId;
      userStatus.lastSeen = lastSeen;
      const res = await this.userStatusRepository.save(userStatus);
      this.logger.log( `upsertLastSeen: Successfully updated Last Seen Status for User ${userId}` );
      return new UserStatusData(res.uid, res.status, res.lastSeen);
    } catch (err) {
      this.logger.error( `upsertLastSeen: Got error saving last seen for user ${userId}: ${err}` );
      throw err;
    }
  }

  async updateUserStatus(status: UserStatus): Promise<UserStatusData> {
    try {
      this.logger.log(`updateUserStatus: Starting to update User Status`);
      await this.userStatusRepository.createQueryBuilder()
        .update(status)
        .set({ lastSeen: status.lastSeen, status: status.status })
        .where('uid = :id', { id: status.uid})
        .andWhere('status not in (:...statuses)', { statuses: [Status.APPEAR_AWAY, Status.APPEAR_BUSY, Status.APPEAR_OFFLINE] }).execute();
      const updatedStatus = this.getUserStatus(status.uid);
      return updatedStatus;
    } catch (err) {
      this.logger.error(`updateUserStatus: Got error while trying to update User Status: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async updateHardUserStatus(status: UserStatus): Promise<UserStatusData> {
    try {
      this.logger.log(`updateHardUserStatus: Starting to update User Status`);
      const updatedStatus = await this.userStatusRepository.save(status);
      return updatedStatus;
    } catch (err) {
      this.logger.error(`updateHardUserStatus: Got error while trying to update User Status: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async getUserStatus(userId: string): Promise<UserStatusData> {
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
