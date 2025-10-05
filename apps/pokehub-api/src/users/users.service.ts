import { PokeHubApiConfiguration } from '../config/configuration.model';
import { IUsersService } from './users.service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IUsersDBService,
  User,
  USERS_DB_SERVICE,
} from '@pokehub/backend/pokehub-users-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import {
  IUpdateUserProfile,
  UserCore,
} from '@pokehub/shared/shared-user-models';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(USERS_DB_SERVICE) private readonly usersDbService: IUsersDBService,
    private readonly configService: ConfigService<PokeHubApiConfiguration, true>
  ) {
    this.logger.setContext(UsersService.name);
  }

  async updateUserProfile(
    userId: string,
    data: IUpdateUserProfile
  ): Promise<void> {
    this.logger.log(
      `${this.updateUserProfile.name}: Updating user profile for user ${userId}`
    );

    const fileExt = data.avatar.split('.')[1];
    await this.usersDbService.updateUserProfile(userId, {
      username: data.username,
      avatarFilename: `avatar.${fileExt}`, // Assuming data.avatar holds the filename
    });
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

    const azureConfig = this.configService.get('azure', { infer: true });

    const avatarUrl = user.avatarFilename
      ? `https://${azureConfig.storageAccount.name}.blob.core.windows.net/${azureConfig.storageAccount.avatarContainerName}/${user.id}/${user.avatarFilename}`
      : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      accountRole: user.accountRole,
      avatarUrl,
    };
  }

  async createUser(
    email: string,
    accountType: User['accountType']
  ): Promise<UserCore> {
    this.logger.log(
      `${this.createUser.name}: Creating user with email ${email}`
    );
    const user = await this.usersDbService.createUser(email, accountType);
    const azureConfig = this.configService.get('azure', { infer: true });

    const avatarUrl = user.avatarFilename
      ? `https://${azureConfig.storageAccount.name}.blob.core.windows.net/${azureConfig.storageAccount.avatarContainerName}/${user.id}/${user.avatarFilename}`
      : null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      accountRole: user.accountRole,
      avatarUrl,
    };
  }

  async getAvatarUrl(): Promise<string | undefined> {
    return undefined;
  }
}
