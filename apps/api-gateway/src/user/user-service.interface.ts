import { CreateUserRequest, UserData, UserDataWithToken, UserPublicProfile } from "@pokehub/user";

export const USER_SERVICE = 'USER SERVICE';

export interface IUserService {
    /**
     * Retrieves the Public Data of the User given its Id
     * @param uid The Id of the User
     * @returns The Public Profile Data of the User
     */
    loadUser(uid: string): Promise<UserPublicProfile>

    /**
     * Creates a new User in the Database by calling the User Microservice
     * @param data The Object containing the necessary data of the User to create
     * @returns The Created User Data along with the Access and Refresh Tokens
     */
    createUser(data: CreateUserRequest): Promise<UserDataWithToken>

    /**
     * Activates the User associated with the provided token
     * @param activationToken The Token to use for activating the User's account.
     * @returns the User Data with the updated email status 
     */
    activateUser(activationToken: string): Promise<UserData> 
}