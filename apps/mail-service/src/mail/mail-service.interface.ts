import { EmailConfirmationRequest } from "@pokehub/mail";

export const MAIL_SERVICE = 'MAIL SERVICE';

export interface IMailService {
    /**
     * Sends an Email Confirmation message to the provided Recipient that needs to be done in a short time before expiration
     * @param recipient The Recipient Details including their email address and temporary Token to use in verification Link
     */
    sendEmailConfirmation(recipient: EmailConfirmationRequest): Promise<void>
}