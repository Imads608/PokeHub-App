import { TypeAccount } from "./type-account.enum";
import { UserData } from './user-data.model'

export class UserDataWithToken {
    user: UserData
    accessToken: string;
    refreshToken: string;

    constructor(userData: UserData, accessToken: string, refreshToken: string) {
        this.user = userData;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}