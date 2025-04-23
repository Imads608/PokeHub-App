import type { UserAccountType } from '@pokehub/shared/shared-user-models';
import type { Request } from 'express';

export interface OAuthRequest extends Request {
  user: { email: string; accountType: UserAccountType };
}
