import type { UserCore } from '@pokehub/shared/shared-user-models';

export const USERS_SERVICE = 'USERS_SERVICE';

export interface IUsersService {
  /**
   * Retrieves a user's core information by username, email, or id.
   * @param id The value to search for (username, email, or id).
   * @param dataType The type of identifier provided: 'username', 'email', or 'id'.
   * @returns A promise that resolves to the user's core information.
   */
  getUserCore(
    id: string,
    dataType: 'username' | 'email' | 'id'
  ): Promise<UserCore | undefined>;
}
