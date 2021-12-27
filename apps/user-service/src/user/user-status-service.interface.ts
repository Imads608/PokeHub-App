import { IUserStatusData } from '@pokehub/user';

export const USER_STATUS_SERVICE = 'USER STATUS SERVICE';

export interface IUserStatusService {
  /**
   * Saves the Last Seen Date of a User given its Id
   * @param userId The Id associated with the User
   * @param lastSeen The Last Seen Date to save into the User Status Table
   */
  upsertLastSeen(userId: string, lastSeen: Date): Promise<void>;

  /**
   * Queries the User Status Table for the Last Seen Data of a User given its Id
   * @param userId The Id associated with the User
   * @returns the Last Seen Data of the User
   */
  getLastSeenOfUser(userId: string): Promise<IUserStatusData>;
}
