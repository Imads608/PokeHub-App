import {IJwtTokenBody} from "./interfaces/token-body.interface";

export class JwtTokenBody implements IJwtTokenBody {
    username: string;
    email: string;
    uid: string;

    constructor(username: string, email: string, uid: string) {
        this.username = username;
        this.email = email;
        this.uid = uid;
    }
}