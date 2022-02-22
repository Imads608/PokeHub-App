import { AuthTokens, JwtTokenBody } from "@pokehub/auth/models";

export const JWT_AUTH_SERVICE = 'JWT_AUTH_SERVICE';

export interface IJwtAuthService {
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
   * Creates The Access Token with a configured Expiration Time given the Payload
   * @param user The Payload needing to be encoded in the token
   * @returns A New Access Token that can be used to access protected APIs
   */
  getNewAccessTokenFromPayload(user: JwtTokenBody): Promise<{ access_token: string }> 

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
   * Creates new Refresh and Access Tokens to use when accessing protected APIs and routes
   * @param userJwt The Public User to encode in the created tokens
   * @returns An Object representing the two new tokens created
   */
  generateAccessAndRefreshTokens(userJwt: JwtTokenBody): Promise<AuthTokens>;
}