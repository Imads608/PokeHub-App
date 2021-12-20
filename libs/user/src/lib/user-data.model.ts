import { IUserData } from '..';
import { TypeAccount } from './type-account.enum';

export class UserData implements IUserData {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  account: TypeAccount;
  emailVerified: boolean;

  constructor(uid: string, email: string, username: string, firstName: string, lastName: string, account: TypeAccount, emailVerified: boolean) {
    this.uid = uid;
    this.email = email;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.account = account;
    this.emailVerified = emailVerified;
  }
}
