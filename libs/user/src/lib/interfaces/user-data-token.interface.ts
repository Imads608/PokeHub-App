import {IUserData} from "./user-data.interface";

export interface IUserDataWithToken {
    user: IUserData
    accessToken: string;
    refreshToken: string;
}