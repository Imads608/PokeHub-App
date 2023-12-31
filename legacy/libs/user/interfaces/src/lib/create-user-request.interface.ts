export interface ICreateUserRequest {
  email: string;
  username: string;
  password: string;
  typeAccount: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}
