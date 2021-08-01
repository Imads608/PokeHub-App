
export class CreateUserRequest {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;

    constructor(email: string, username: string, firstName?: string, lastName?: string) {
        this.email = email;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}