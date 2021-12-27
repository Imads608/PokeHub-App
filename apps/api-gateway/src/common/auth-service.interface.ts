import { UserDataWithToken } from '@pokehub/user'
import { EmailLogin, UsernameLogin, JwtTokenBody, AuthTokens } from '@pokehub/auth';

export const AUTH_SERVICE = "AUTH SERVICE";

export interface IAuthService {
    /**
     * Authenticates a User through Google OAuth.
     * @param token The Token passed by Google for validation
     * @returns The Data related to the User along with the Access and Refresh Tokens
     */
    googleOAuthLogin(token: string): Promise<UserDataWithToken>

    /**
     * Authenticates a User through Email or Username Credentials
     * @param userCreds The User Credentials passed in which can be with their email address or username
     * @returns The Data related to the User along with the Access and Refresh Tokens
     */
    loginUser(userCreds: EmailLogin | UsernameLogin): Promise<UserDataWithToken>

    /**
     * Generates Access and Refresh Tokens based on the User Data
     * @param user The User Data to encode in the Tokens
     * @returns An Object containing the Access and Refresh Tokens
     */
    generateNewTokens(user: JwtTokenBody): Promise<AuthTokens>

    /**
     * Validates and returns the User Data from the Token
     * @param verificationToken The Token to validate and to extract data from
     * @returns the Data contained in the Token
     */
    validateEmailConfirmationToken(verificationToken: string): Promise<JwtTokenBody>

    /**
     * Validates and Decodes the provided Access Token and returns the User Data associated with it.
     * @param accessToken The Access Token that needs to be decoded and validated
     * @returns An Object containing the encoded User Data
     */
    decodeToken(accessToken: string): Promise<JwtTokenBody>

    /**
     * Generates A New Access Token given its Refresh Token
     * @param refreshToken The Refresh Token to use for generating the new Access Token
     * @returns An Object containing the created Access Token
     */
    getNewAccessToken(refreshToken: string): Promise<{ access_token: string}>

    /**
     * Generates a new Token for Email Verification
     * @param userData The User Data to encode in the Token
     * @returns The Token to use for Email Verification
     */
    generateEmailVerficationToken(userData: JwtTokenBody): Promise<{ email_verification_token: string}>
}