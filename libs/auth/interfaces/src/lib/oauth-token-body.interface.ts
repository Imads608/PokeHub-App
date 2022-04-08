import { IRefreshToken } from "..";

export interface IOAuthTokenBody {
  username: string;
  email: string;
  uid: string;
  accessToken: string;
  refreshToken?: IRefreshToken;
}
