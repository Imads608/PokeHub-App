import { IRefreshToken } from "..";

export interface IAuthTokens {
  accessToken: string;
  refreshToken: IRefreshToken;
}
