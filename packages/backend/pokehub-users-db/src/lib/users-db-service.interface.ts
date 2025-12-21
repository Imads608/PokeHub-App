import type { User } from './schema/user.schema';
import { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';

export const USERS_DB_SERVICE = 'USERS_DB_SERVICE';

export interface IUsersDBService {
  updateUserProfile(
    userId: string,
    data: Omit<IUpdateUserProfile, 'avatar'> & { avatarFilename?: string }
  ): Promise<User>;

  getUserByEmail(email: string): Promise<User | undefined>;

  createUser(email: string, accountType: User['accountType']): Promise<User>;

  getUser(id: string): Promise<User | undefined>;

  getUserByUsername(username: string): Promise<User | undefined>;
}
