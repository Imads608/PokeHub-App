/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from '@pokehub/user';
import { Repository } from 'typeorm';

@Injectable()
export class UserStatusService { 
    logger = new Logger(UserStatusService.name);

    constructor(@InjectRepository(UserStatus) private userStatusRepository: Repository<UserStatus>) {}

    async upsertLastSeen(userId: string, lastSeen: Date): Promise<void> {
        try {
            const userStatus = this.userStatusRepository.create();
            userStatus.uid = userId;
            userStatus.lastSeen = lastSeen;
            await this.userStatusRepository.save(userStatus);
        } catch (err) {
            this.logger.error('Got error saving last seen for user ' + userId + ': ' + err);
        }
    }

    async getLastSeenOfUser(userId: string): Promise<UserStatus> {
        try {
            const userStatus: UserStatus = await this.userStatusRepository.findOne(userId);
            return userStatus;
        } catch (err) {
            this.logger.error('GOt error getting last seen of user ' + userId + ': ' + err);
        }
    }
}
