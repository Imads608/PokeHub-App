import type { UserAccountRole } from './user-account-roles.type';
import type { UserAccountType } from './user-account-type.type';

export interface UserCore {
  id: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  accountRole: UserAccountRole;
  accountType: UserAccountType;
}

export type UserJwtData = UserCore;
