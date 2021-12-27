import { TypeAccount } from "../type-account.enum";

export interface IUserData {
    uid: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    account: TypeAccount;
    emailVerified: boolean;
    countUsernameChanged: number;
}