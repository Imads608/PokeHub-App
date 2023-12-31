import { IUserSocket } from "./interfaces/user-socket.interface";

export class UserSocket implements IUserSocket {
  uid: string;
  username: string;
  socketClient: string;

  constructor(uid: string, username: string, socketClient: string) {
    this.uid = uid;
    this.username = username;
    this.socketClient = socketClient;
  }
}
