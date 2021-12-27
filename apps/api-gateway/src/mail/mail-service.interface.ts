export const MAIL_SERVICE = 'MAIL SERVICE';

export interface IMailService {
    /**
     * Sends an Confirmation Email to the provided Email Address which the User should respond to based on the expiration period of the provided token.
     * @param emailAddress The Email Address to send the Confirmation Email to.
     * @param validationToken The Token to use for validating the request when User follows the Email Confirmation Link
     */
    sendEmailConfirmation(emailAddress: string, validationToken: string): Promise<void>
}