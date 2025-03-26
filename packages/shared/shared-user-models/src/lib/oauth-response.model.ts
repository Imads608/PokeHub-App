import type { UserCore } from './user-data.model';
import type { Tokens } from '@pokehub/shared/shared-auth-models';

export interface OAuthLoginResponse {
  user: UserCore;
  tokens: Tokens;
}
