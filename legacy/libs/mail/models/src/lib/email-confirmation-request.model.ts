import { IEmailConfirmationRequest } from '@pokehub/mail/interfaces';

export class EmailConfirmationRequest implements IEmailConfirmationRequest {
  recipientEmail: string;
  linkValidationToken: string;

  constructor(recipientEmail: string, linkValidationToken: string) {
    this.recipientEmail = recipientEmail;
    this.linkValidationToken = linkValidationToken;
  }
}
