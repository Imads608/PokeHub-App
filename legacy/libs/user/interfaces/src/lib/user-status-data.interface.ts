import { Status } from './status.enum';

export interface IUserStatusData {
  id: string;
  state: Status;
  lastSeen: Date;
}
