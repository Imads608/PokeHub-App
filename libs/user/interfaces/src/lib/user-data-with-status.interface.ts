import { UserPublicData } from "@pokehub/user/models";
import { IUserData, IUserPublicData, IUserStatusData } from "..";

export interface IUserDataWithStatus {
    user: IUserData | IUserPublicData;
    status: IUserStatusData;
}