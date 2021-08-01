export class JwtTokenBody {
    username: string;
    email: string;
    uid: string;

    constructor(username: string, email: string, uid: string) {
        this.username = username;
        this.email = email;
        this.uid = uid;
    }
}