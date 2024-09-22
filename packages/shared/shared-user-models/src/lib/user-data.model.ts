import { UserCoreAccountRole } from './user-account-roles.type';
import { UserAccountType } from './user-account-type.type';

export interface UserCore {
  id: string;
  email: string;
  name: string;
  accountRole: UserCoreAccountRole;
  accountType: UserAccountType;
}
