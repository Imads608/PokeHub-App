import { IUserStatusData } from '@pokehub/user/interfaces';
import { Status } from '@pokehub/user/interfaces';

export class UserStatusData implements IUserStatusData {
  id: string;
  state: Status;
  lastSeen: Date;

  constructor(id: string, state: Status, lastSeen: Date) {
    this.id = id;
    this.state = state;
    this.lastSeen = lastSeen;
  }
}
