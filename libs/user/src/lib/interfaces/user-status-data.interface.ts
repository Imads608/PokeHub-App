import { Status } from "../status.enum";

export interface IUserStatusData {
    uid: string;
    status: Status;
    lastSeen: Date;
}