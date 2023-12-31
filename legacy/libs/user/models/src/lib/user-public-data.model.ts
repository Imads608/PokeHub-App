import { IUserPublicData } from "@pokehub/user/interfaces";
import { UserStatusData } from "..";

export class UserPublicData implements IUserPublicData {
    uid: string;
    username: string;
    emailVerified: boolean;
    avatarUrl?: string;
    status?: UserStatusData;

    constructor(uid: string, username: string, emailVerified: boolean, avatarUrl?: string, status?: UserStatusData) {
        this.uid = uid;
        this.username = username;
        this.emailVerified = emailVerified;
        this.avatarUrl = avatarUrl;
        this.status = status;
    }
}