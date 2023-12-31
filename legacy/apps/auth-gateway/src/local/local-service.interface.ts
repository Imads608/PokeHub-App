import { EmailLogin, UsernameLogin } from "@pokehub/auth/models";
import { UserDataWithToken } from "@pokehub/user/models";

export const LOCAL_SERVICE = 'LOCAL_SERVICE';

export interface ILocalService {
    /**
     * Authenticate a User using their email address and password
     * @param userCreds User credentials using their email address
     * @returns The Data associated with the User along with the Access and Refresh Tokens
     */
    emailLogin(userCreds: EmailLogin): Promise<UserDataWithToken>;

    /**
     * Authenticate a User using their username and password
     * @param userCreds User credentials using their username
     * @returns The Data associated with the User along with the Access and Refresh Tokens
     */
    usernameLogin(userCreds: UsernameLogin): Promise<UserDataWithToken>;
}