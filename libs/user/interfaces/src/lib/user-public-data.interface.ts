import { IUserStatusData } from "..";

export interface IUserPublicData {
    uid: string;
    username: string;
    emailVerified: boolean;
    avatarUrl?: string;
    status?: IUserStatusData;
}