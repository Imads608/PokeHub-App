import { UserStatus } from '@pokehub/user/database';
import { IUserStatusData } from '@pokehub/user/interfaces';
import { UserStatusData } from '@pokehub/user/models';

export const USER_STATUS_SERVICE = 'USER STATUS SERVICE';

export interface IUserStatusService {
  /**
   * Saves the Last Seen Date of a User given its Id
   * @param userId The Id associated with the User
   * @param lastSeen The Last Seen Date to save into the User Status Table
   */
  upsertLastSeen(userId: string, lastSeen: Date): Promise<UserStatusData>;

  /**
   * Queries the User Status Table for the Last Seen Data of a User given its Id
   * @param userId The Id associated with the User
   * @returns the Last Seen Data of the User
   */
  getUserStatus(userId: string): Promise<UserStatusData>;

  /**
   * Updates the User's Status in the Database with the provided parameter if the User does not "APPEAR" to be Away, Offline or Available
   * @param status The New Status of the User that needs to be saved to the database.
   * @returns the Updated Status in the Database
   */
  updateUserStatus(status: UserStatus): Promise<UserStatusData>

  /**
   * Updates the User's Status in the Database with the provided parameter if the User regardless of the previous status.
   * @param status The New Status of the User that needs to be saved to the database
   * @returns the Updated Status in the Database
   */
  updateHardUserStatus(status: UserStatus): Promise<UserStatusData>
}
