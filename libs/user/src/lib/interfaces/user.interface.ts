import { TypeAccount } from '../type-account.enum';

export interface IUser {
  uid: string;
  username: string;
  firstName: string;
  lastName?: string;
  password?: string;
  email: string;
  emailVerified: boolean;
  countUsernameChanged: number;
  account: TypeAccount;
}
