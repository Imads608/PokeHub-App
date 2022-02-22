import { UserStatusData } from "@pokehub/user/models";
import { IUserStatusEvent } from "..";

export class UserStatusEvent implements IUserStatusEvent {
  status: UserStatusData;
  isHardUpdate: boolean;

  constructor(status: UserStatusData, isHardUpdate: boolean) {
    this.status = status;
    this.isHardUpdate = isHardUpdate;
  }
}
