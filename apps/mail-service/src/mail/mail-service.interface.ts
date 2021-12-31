import { EmailConfirmationRequest, PasswordResetRequest } from '@pokehub/mail';

export const MAIL_SERVICE = 'MAIL SERVICE';

export interface IMailService {
  /**
   * Sends an Email Confirmation message to the provided Recipient that needs to be done in a short time before expiration
   * @param recipient The Recipient Details including their email address and temporary Token to use in verification Link
   */
  sendEmailConfirmation(recipient: EmailConfirmationRequest): Promise<void>;

  /**
   * Sends a Password Reset Email to the provided Recipient that needs to be done in a short amount of time before the token expires
   * @param recipient The Recipient Details including their email address and temporary Token to use in the reset link
   */
  sendPasswordResetEmail( recipient: PasswordResetRequest ): Promise<void>
}
