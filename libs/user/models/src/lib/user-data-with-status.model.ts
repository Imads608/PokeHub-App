import { IUserDataWithStatus } from "@pokehub/user/interfaces";
import { UserData, UserPublicData, UserStatusData } from "..";

export class UserDataWithStatus implements IUserDataWithStatus {
    user: UserData | UserPublicData;
    status: UserStatusData;

    constructor(user: UserData | UserPublicData, status: UserStatusData) {
        this.user = user;
        this.status = status;
    }
}