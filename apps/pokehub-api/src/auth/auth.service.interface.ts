import { UserJwtData } from '@pokehub/backend/shared-auth-utils';
import { AccessToken } from '@pokehub/shared/shared-auth-models';
import type { OAuthLoginResponse } from '@pokehub/shared/shared-user-models';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface IAuthService {
  /**
   * Creates or Logs in An Existing User that uses OAuth Authentication.
   * @param email - The email id of the User being logged in or being crreated.
   * @returns Response containing User related data and Auth Tokens.
   */
  createOrLoginUser(email: string): Promise<OAuthLoginResponse>;

  refreshAccessToken(user: UserJwtData): Promise<AccessToken>;
}
