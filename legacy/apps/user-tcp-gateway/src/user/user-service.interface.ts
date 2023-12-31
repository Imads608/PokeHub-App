import { EmailLogin } from "@pokehub/auth/models";
import { UserIdTypes } from "@pokehub/user/interfaces";
import { CreateUserRequest, UserData, UserPublicData, UserStatusData } from "@pokehub/user/models";

export const USER_SERVICE = 'USER_SERVICE';

export interface IUserService {
    /**
     * Creates a New User and stores them in the database
     * @returns The User Object in the database
     * @param createReq The Request containing the User Details
     */
    createUser(createReq: CreateUserRequest): Promise<UserData>

    /**
     * Creates/Finds the User in teh database and returns the details
     * @returns The User Object in the database
     * @param createUser The Request containing the User Details
     */
    googleOAuthLogin(createUser: CreateUserRequest): Promise<UserData>

    /**
     * Retrieves the Public Data of the User
     * @returns the Object containing the Public Data available for the User
     * @param uid The Internal Id of the User
     */
    getPublicUser(uid: string): Promise<UserPublicData>

    /**
     * Retrieves the User in the database and returns the details
     * @returns The User Object in the database
     * @param uid The Internal Id of the User
     */
    findUser(uid: string): Promise<UserData>

    /**
     * Retrieves the User in the database and returns the details
     * @returns The User Object in the database
     * @param email The Email Id of the User
     */
    findUserByEmail(email: string): Promise<UserData>

    /**
     * Retrieves the User in the database and returns the details
     * @returns The User Object in the database
     * @param username The Username of the User
     */
    findUserByUsername(username: string): Promise<UserData>

    /**
     * Retrieves the User Status in the database and returns the details
     * @returns The User Status Object in the database
     * @param id The Id of the User Status Record
     */
    getUserStatus(id: string): Promise<UserStatusData>

    /**
     * Verifies the Email Address of the User given the User Id and returns the database record
     * @returns The User Status Object in the database.
     * @param userId The Internal Id of the User
     */
    verifyUserEmail(userId: string): Promise<UserData>

    /**
     * Verifies if the Email Address provided exists in the database
     * @returns A Boolean representing if the Email Id exists or not
     * @param email THe Email Id of the User
     */
    checkEmailExists(email: string): Promise<boolean>

    /**
     * Checks if the User with the given Id exists in the database
     * @returns A Boolean representing if the User exists or not
     * @param user An Object containing either the User Internal Id, Username or Email Id
     */
    checkUserExists(user: { userId: string, idType: UserIdTypes}): Promise<boolean>

    /**
     * Updates the Password of the User in the Database given the Email Id
     * @returns The User Data Object from the database
     * @param userData An Object containing the Email Id and Password
     */
    updatePassword(userData: EmailLogin): Promise<UserData>

    /**
     * Updates The User's Data given the Object
     * @returns The Updated User Object in the database
     * @param userData The Updated User Object that needs to be saved in the database
     */
    updateUserData(userData: UserData): Promise<UserData>
}