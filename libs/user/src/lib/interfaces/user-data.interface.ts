import { TypeAccount } from "@pokehub/user";

export interface IUserData {
    uid: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    account: TypeAccount;
    emailVerified: boolean;
}