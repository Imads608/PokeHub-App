export interface ICreateUserRequest {
  email: string;
  username: string;
  password: string;
  typeAccount: string;
  firstName?: string;
  lastName?: string;
}
