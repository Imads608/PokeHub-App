import { CreateUserRequest, UserData } from '@pokehub/user';

export const USER_SERVICE = 'USER SERVICE';

export interface IUserService {
  /**
   * Updates the Verification Status of a User's email Address
   * @param userId The Id associated with the User
   * @returns The Data of the User after saving the changes
   */
  validateUserEmail(userId: string): Promise<UserData>;

  /**
   * Updates A User's password given their email address
   * @param email The email address of the User whose password needs to be updated
   * @param newPassword The new password associated with the User Account
   * @returns The User Data Object after updating the password
   */
  updatePassword(email: string, newPassword: string): Promise<UserData>

  /**
   * Checks if an Email Address exists in the User's table.
   * @param email The Email Id that needs to be checked
   * @returns A Boolean indicating whether the Email Address exists.
   */
  doesEmailExist(email: string): Promise<boolean>

  /**
   * Creates a new User in the User Table given the Data
   * @param userReq The New User to insert into the User Table
   * @returns The User Data Object in the table after insertion
   */
  createUser(userReq: CreateUserRequest): Promise<UserData>;

  /**
   * Creates a New User if not already existing in the Table and returns the given Data
   * @param userReq The Data related to the User to insert or find
   * @returns The User Data Object in the table after insertion
   */
  createOrFindGoogleOAuthUser(userReq: CreateUserRequest): Promise<UserData>;

  /**
   * Queries the table and returns the User Data if the User Id was found
   * @param uid The user id of the User in the Table
   * @returns the User Data related to the id
   */
  findUser(uid: string): Promise<UserData>;

  /**
   * Queries the User Table and returns the Data if the User Email Id was found
   * @param email The email address associated with the User
   * @returns The User Data related to the email address
   */
  findUserByEmail(email: string): Promise<UserData>;

  /**
   * Queries the User Table and returns the Data if the Username was found.
   * @param username The Username associated with the User
   * @returns the User Data related to the username
   */
  findUserByUsername(username: string): Promise<UserData>;
}
