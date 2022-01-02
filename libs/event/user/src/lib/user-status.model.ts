import { IUserStatus } from "./interfaces/user-status.interface";

export class UserStatusData implements IUserStatus {
  userUid: string;
  sentTime: Date;
  isAway: boolean;

  constructor(uid: string, sentTime: Date, isAway: boolean) {
    this.userUid = uid;
    this.sentTime = sentTime;
    this.isAway = isAway;
  }
}
