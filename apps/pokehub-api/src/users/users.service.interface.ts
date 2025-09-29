import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { User } from '@pokehub/backend/pokehub-users-db';
import type { UserCore } from '@pokehub/shared/shared-user-models';

export const USERS_SERVICE = 'USERS_SERVICE';

export interface IUsersService {
  /**
   * Generates a full URL for a user's avatar.
   * @param userId The ID of the user.
   * @returns A promise that resolves to the full avatar URL, or undefined if not found.
   */
  getAvatarUrl(userId: string): Promise<string | undefined>;

  /**
   * Updates a user's profile with the given data.
   * @param userId The ID of the user to update.
   * @param data The data to update the user profile with.
   * @returns A promise that resolves when the profile has been updated.
   */
  updateUserProfile(userId: string, data: UpdateUserProfileDTO): Promise<void>;

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

  createUser(
    email: string,
    accountType: User['accountType']
  ): Promise<UserCore>;
}
