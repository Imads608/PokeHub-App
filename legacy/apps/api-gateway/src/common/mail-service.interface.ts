export const MAIL_SERVICE = 'MAIL SERVICE';

export interface IMailService {
  /**
   * Sends an Confirmation Email to the provided Email Address which the User should respond to based on the expiration period of the provided token.
   * @param emailAddress The Email Address to send the Confirmation Email to.
   * @param validationToken The Token to use for validating the request when User follows the Email Confirmation Link
   */
  sendEmailConfirmation( emailAddress: string, validationToken: string ): Promise<void>;

  /**
   * Sends an Email to the provided Email Address for the User to reset their password through a link that has a short expiration period.
   * @param emailAddress The Email Address to send the Pasword Reset Link to
   * @param resetToken The Token to use for validating the request when the User follows the Password Reset Email Link
   */
  sendPasswordReset(emailAddress: string, resetToken: string): Promise<void>
}
