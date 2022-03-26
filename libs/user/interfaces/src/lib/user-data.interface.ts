import { BucketDetails } from '@pokehub/common/object-store/models';
import { IUserStatusData } from '..';
import { TypeAccount } from './type-account.enum';

export interface IUserData {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  account: TypeAccount;
  avatar: BucketDetails | null,
  avatarUrl?: string;
  emailVerified: boolean;
  countUsernameChanged: number;
  status?: IUserStatusData;
}
