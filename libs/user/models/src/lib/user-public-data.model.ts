import { IUserPublicData } from "@pokehub/user/interfaces";

export class UserPublicData implements IUserPublicData {
    uid: string;
    username: string;
    emailVerified: boolean;
    avatarUrl?: string;

    constructor(uid: string, username: string, emailVerified: boolean, avatarUrl?: string) {
        this.uid = uid;
        this.username = username;
        this.emailVerified = emailVerified;
        this.avatarUrl = avatarUrl;
    }
}