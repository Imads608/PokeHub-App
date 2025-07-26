import { IUsersService } from './users.service.interface';
import { Inject, Injectable } from '@nestjs/common';
import {
  IUsersDBService,
  USERS_DB_SERVICE,
} from '@pokehub/backend/pokehub-users-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { UserCore } from '@pokehub/shared/shared-user-models';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(USERS_DB_SERVICE) private readonly usersDbService: IUsersDBService
  ) {
    this.logger.setContext(UsersService.name);
  }
  async getUserCore(
    id: string,
    dataType: 'username' | 'email' | 'id'
  ): Promise<UserCore | undefined> {
    this.logger.log(
      `${this.getUserCore.name}: Getting User info with type ${dataType}`
    );

    const user =
      dataType === 'username'
        ? await this.usersDbService.getUserByUsername(id)
        : dataType === 'email'
        ? await this.usersDbService.getUserByEmail(id)
        : await this.usersDbService.getUser(id);

    if (!user) {
      this.logger.warn(
        `${this.getUserCore.name}: Failed to find user for ${id} with type ${dataType}`
      );
      return undefined;
    }

    return user;
  }
}
