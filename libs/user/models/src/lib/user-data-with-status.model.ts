import { UserData, UserPublicData, UserStatusData } from "..";

export class UserDataWithStatus {
    user: UserData | UserPublicData;
    status: UserStatusData;

    constructor(user: UserData | UserPublicData, status: UserStatusData) {
        this.user = user;
        this.status = status;
    }
}