import { BucketDetails } from "@pokehub/common/object-store/models";
import { IUserData } from "@pokehub/user/interfaces";
import { TypeAccount } from '@pokehub/user/interfaces';

export class UserData implements IUserData {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  account: TypeAccount;
  emailVerified: boolean;
  avatar: BucketDetails | null;
  avatarUrl?: string;
  password?: string;
  countUsernameChanged: number;

  constructor(
    uid: string,
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    account: TypeAccount,
    emailVerified: boolean,
    avatar = null,
    countUsernameChanged = 0,
    password = undefined,
    avatarUrl?: string
  ) {
    this.uid = uid;
    this.email = email;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.account = account;
    this.emailVerified = emailVerified;
    this.avatar = avatar;
    this.countUsernameChanged = countUsernameChanged;
    this.password = password;
    this.avatarUrl = avatarUrl;
  }
}
