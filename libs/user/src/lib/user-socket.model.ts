export class UserSocket {
  uid: string;
  username: string;
  socketClient: string;

  constructor(uid: string, username: string, socketClient: string) {
    this.uid = uid;
    this.username = username;
    this.socketClient = socketClient;
  }
}
