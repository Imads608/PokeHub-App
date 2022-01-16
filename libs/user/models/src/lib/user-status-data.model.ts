import { IUserStatusData } from '@pokehub/user/interfaces';
import { Status } from '@pokehub/user/interfaces';

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
