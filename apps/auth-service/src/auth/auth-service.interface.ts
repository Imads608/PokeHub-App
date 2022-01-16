import { AuthTokens, EmailLogin, JwtTokenBody, UsernameLogin, } from '@pokehub/auth/models';
import { UserDataWithToken } from '@pokehub/user/models';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface IAuthService {
  /**
   * Authenticates the user through the provided Token and returns the data associated with the User along with the access and refresh tokens
   * @param tokenId The Token returned by the Google API
   * @returns The User Data along with the Access and Refresh Tokens
   */
  googleOAuthLogin(tokenId: string): Promise<UserDataWithToken>;

  /**
   * Verifies if the Access Token is valid
   * @param accessToken The Access Token needing to be validated
   * @returns A Boolean representing if the provided Access Token is valid or not.
   */
  validateAccessToken(accessToken: string): Promise<boolean>;

  /**
   * Validates the Given Token and returns the User Data embedded in the Token
   * @param verificationToken The Token to use for activating the User's account
   * @returns the User Data embedded in the Token
   */
  validateEmailVerificationToken( verificationToken: string ): Promise<JwtTokenBody>;

  /**
   * Validates the provided Password Reset Token and returns the Email address embedded in the Token
   * @param passwordResetToken The Token to use to validate for Resetting a User's Password
   * @returns An Object containing The Email Address embedded in the Token
   */
  validatePasswordResetToken(passwordResetToken: string): Promise<{ email: string }>

  /**
   * Decodes the Access Token and returns the User Data
   * @param accessToken The Access Token that needs to be decoded
   * @returns The User Data associated with the token
   */
  decodeToken(accessToken: string): Promise<JwtTokenBody>;

  /**
   * Creates the Access Token with a configured Expiration Time using the Refresh Token
   * @param refreshToken The Refresh Token to use when creating the Access Token
   * @returns A New Access Token that can be used to access protected APIs.
   */
  getNewAccessToken(refreshToken: string): Promise<{ access_token: string }>;

  /**
   * Creates a Token that can be used for Email Verification.
   * @param user The Public User Data to encode in the created token
   * @returns An Object representing the created Token.
   */
  getNewEmailVerificationToken( user: JwtTokenBody ): Promise<{ email_verification_token: string }>;

  /**
   * Creates a Token that can be used for Resetting a User's password.
   * @param user An Object containing the Email Address of the User
   * @returns An Object containing the Token to use for resetting the User's password
   */
  getNewPasswordResetToken(user: { email: string }): Promise<{ password_reset_token: string }>

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

  /**
   * Creates new Refresh and Access Tokens to use when accessing protected APIs and routes
   * @param userJwt The Public User to encode in the created tokens
   * @returns An Object representing the two new tokens created
   */
  generateNewTokens(userJwt: JwtTokenBody): Promise<AuthTokens>;
}
