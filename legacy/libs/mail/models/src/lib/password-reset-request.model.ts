import { IPasswordResetRequest } from "@pokehub/mail/interfaces";

export class PasswordResetRequest implements IPasswordResetRequest {
    recipientEmail: string;
    resetToken: string;

    constructor(recipientEmail: string, resetToken: string) {
        this.recipientEmail = recipientEmail;
        this.resetToken = resetToken;
    }
}