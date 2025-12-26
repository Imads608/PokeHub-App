import { PokeHubApiConfiguration } from '../config/configuration.model';
import { IUsersService } from './users.service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IUsersDBService,
  User,
  USERS_DB_SERVICE,
} from '@pokehub/backend/pokehub-users-db';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
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
  ): Promise<IUpdateUserProfile> {
    this.logger.log(
      `${this.updateUserProfile.name}: Updating user profile for user ${userId}`
    );

    // Get current user to check existing username
    const currentUser = await this.usersDbService.getUser(userId);
    if (!currentUser) {
      throw new ServiceError('BadRequest', 'User not found');
    }

    // If user already has a username and they're trying to change it, reject
    if (currentUser.username && data.username) {
      throw new ServiceError(
        'BadRequest',
        'Username cannot be changed once set'
      );
    }

    // If user doesn't have a username and they're not providing one, reject
    if (!currentUser.username && !data.username) {
      throw new ServiceError(
        'BadRequest',
        'Username is required for users without a username'
      );
    }

    // If user has username and no update data provided, return empty (no-op)
    if (currentUser.username && !data.username && !data.avatar) {
      return {};
    }

    const fileExt = data.avatar?.split('.')[1];
    await this.usersDbService.updateUserProfile(userId, {
      username: data.username,
      avatarFilename: data.avatar ? `avatar.${fileExt}` : undefined,
    });

    if (data.avatar) {
      return {
        ...data,
        avatar: this.getAvatarUrl(userId, `avatar.${fileExt}`),
      };
    }

    return data;
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

    const avatarUrl = user.avatarFilename
      ? this.getAvatarUrl(user.id, user.avatarFilename)
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

    const avatarUrl = user.avatarFilename
      ? this.getAvatarUrl(user.id, user.avatarFilename)
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

  getAvatarUrl(userId: string, avatarFileName: string): string {
    const azureConfig = this.configService.get('azure', { infer: true });
    return `https://${azureConfig.storageAccount.name}.blob.core.windows.net/${azureConfig.storageAccount.avatarContainerName}/${userId}/${avatarFileName}`;
  }

  async deleteUser(userId: string): Promise<void> {
    this.logger.log(`${this.deleteUser.name}: Deleting user ${userId}`);

    // Teams will be deleted automatically via DB cascade
    await this.usersDbService.deleteUser(userId);

    this.logger.log(
      `${this.deleteUser.name}: User ${userId} deleted successfully`
    );
  }
}
