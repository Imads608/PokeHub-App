import type { User } from './schema/user.schema';
import { usersTable } from './schema/user.schema';
import {
  USERS_DB_SERVICE,
  type IUsersDBService,
} from './users-db-service.interface';
import type { Provider } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import {
  POSTGRES_SERVICE,
  PostgresService,
} from '@pokehub/backend/pokehub-postgres';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';
import { eq } from 'drizzle-orm';

@Injectable()
class UsersDBService implements IUsersDBService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(POSTGRES_SERVICE) private readonly dbService: PostgresService
  ) {
    this.logger.setContext(UsersDBService.name);
  }

  async updateUserProfile(
    userId: string,
    data: Omit<IUpdateUserProfile, 'avatar'> & { avatarFilename?: string }
  ) {
    this.logger.log(`${this.updateUserProfile.name}: Updating User Profile`);
    const res = await this.dbService
      .update(usersTable)
      .set({ username: data.username, avatarFilename: data.avatarFilename })
      .where(eq(usersTable.id, userId))
      .returning();

    if (res.length === 0) {
      this.logger.error(
        `${this.updateUserProfile.name}: Unable to update user profile`
      );
      throw new ServiceError('ServiceError', 'Unable to update user profile');
    }

    this.logger.log(
      `${this.updateUserProfile.name}: User Profile Updated Successfully`
    );
    return res[0];
  }

  async createUser(email: string, accountType: User['accountType']) {
    this.logger.log(`${this.createUser.name}: Creating User`);
    const user: typeof usersTable.$inferInsert = { email, accountType };
    const res = await this.dbService
      .insert(usersTable)
      .values(user)
      .returning();

    if (res.length === 0) {
      this.logger.error(`${this.createUser.name}: Unable to create user`);
      throw new ServiceError('ServiceError', 'Unable to create user');
    }

    this.logger.log(`${this.createUser.name}: User Created Successfully`);
    return res[0];
  }

  async getUserByEmail(email: string) {
    this.logger.log(
      `${this.getUserByEmail.name}: Fetching User by Email: ${email}`
    );
    const res = await this.dbService
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .execute();

    if (res.length === 0) {
      this.logger.log(
        `${this.getUserByEmail.name}: No user found with email: ${email}`
      );
      return undefined;
    }

    this.logger.log(
      `${this.getUserByEmail.name}: User found with email: ${email}`
    );
    return res[0];
  }

  async getUser(id: string) {
    const res = await this.dbService
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    if (res.length === 0) {
      return undefined;
    }
    return res[0];
  }

  async getUserByUsername(username: string) {
    const res = await this.dbService
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .execute();

    if (res.length === 0) {
      return undefined;
    }

    return res[0];
  }
}

export const UsersDBProvider: Provider = {
  provide: USERS_DB_SERVICE,
  useClass: UsersDBService,
};
