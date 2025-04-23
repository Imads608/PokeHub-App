import type {
  UserAccountRole,
  UserAccountType,
} from '@pokehub/shared/shared-user-models';

export interface UserJwtData {
  id: string;
  email: string;
  accountType: UserAccountType;
  accountRole: UserAccountRole;
}
