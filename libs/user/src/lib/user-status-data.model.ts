import { IUserStatusData } from "./interfaces/user-status-data.interface";
import { Status } from "./status.enum";

export class UserStatusData implements IUserStatusData {
    uid: string;
    status: Status;
    lastSeen: Date;

    constructor(uid: string, status: Status, lastSeen: Date) {
        this.uid = uid;
        this.status = status;
        this.lastSeen = lastSeen;
    }
}