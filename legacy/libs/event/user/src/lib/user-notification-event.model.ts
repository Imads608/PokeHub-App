import { IUserNotificationEvent } from "./interfaces/user-notification-event.interface";

export class UserNotificationEvent implements IUserNotificationEvent {
  shouldReceive: boolean;
  subscribedUserUid: string;

  constructor(shouldReceive: boolean, subscribedUserUid: string) {
    this.shouldReceive = shouldReceive;
    this.subscribedUserUid = subscribedUserUid;
  }
}
