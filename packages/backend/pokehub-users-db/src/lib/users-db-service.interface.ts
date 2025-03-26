import type { User } from './schema/user.schema';

export const USERS_DB_SERVICE = 'USERS_DB_SERVICE';

export interface IUsersDBService {
  getUserByEmail(email: string): Promise<User | undefined>;

  createUser(email: string, accountType: User['accountType']): Promise<User>;

  getUser(id: string): Promise<User | undefined>;
}
