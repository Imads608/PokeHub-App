import { IUserDataWithToken } from "./interfaces/user-data-token.interface";
import { TypeAccount } from "./type-account.enum";
import { UserData } from './user-data.model'

export class UserDataWithToken implements IUserDataWithToken {
    user: UserData
    accessToken: string;
    refreshToken: string;

    constructor(userData: UserData, accessToken: string, refreshToken: string) {
        this.user = userData;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}