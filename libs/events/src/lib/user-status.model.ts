export class UserStatusData {
    userUid: string;
    sentTime: Date;
    isAway: boolean;

    constructor(uid: string, sentTime: Date, isAway: boolean) {
        this.userUid = uid;
        this.sentTime = sentTime;
        this.isAway = isAway;
    }
}