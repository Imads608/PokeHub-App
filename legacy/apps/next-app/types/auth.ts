import { IUserProfile, IUserProfileWithToken } from "@pokehub/user/interfaces";

export interface UserSignup {
  email: string;
  username: string;
  password: string;
}

export interface LoginSuccessAction {
  data: IUserProfileWithToken | IUserProfile;
  socketClientId: string;
}