import { ICreateUserRequest } from '@pokehub/user/interfaces';

export class CreateUserRequest implements ICreateUserRequest {
  email: string;
  username: string;
  password: string;
  typeAccount: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;

  constructor(
    email: string,
    username: string,
    typeAccount: string,
    password: string,
    firstName?: string,
    lastName?: string,
    emailVerified = false
  ) {
    this.email = email;
    this.username = username;
    this.password = password;
    this.typeAccount = typeAccount;
    this.firstName = firstName;
    this.lastName = lastName;
    this.emailVerified = emailVerified;
  }
}
