import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { TCPEndpoints, EmailConfirmationRequest, PasswordResetRequest } from '@pokehub/mail';
import { AppLogger } from '@pokehub/logger';
import { IMailService, MAIL_SERVICE } from './mail-service.interface';

@Controller()
export class MailController {
  constructor( @Inject(MAIL_SERVICE) private mailService: IMailService, private readonly logger: AppLogger ) {
    logger.setContext(MailController.name);
  }

  @MessagePattern({ cmd: TCPEndpoints.SEND_EMAIL_CONFIRMATION }, Transport.TCP)
  async sendEmailConfirmation( request: EmailConfirmationRequest ): Promise<void> {
    this.logger.log( `sendEmailConfirmation: Got request to send Email Confirmation for email ${request.recipientEmail}` );
    await this.mailService.sendEmailConfirmation(request);
    this.logger.log(`sendEmailConfirmation: Successfully sent Email Confirmation for email ${request.recipientEmail}`);
  }

  @MessagePattern({ cmd: TCPEndpoints.SEND_PASSWORD_RESET }, Transport.TCP)
  async sendPasswordReset( request: PasswordResetRequest ): Promise<void> {
    this.logger.log( `sendPasswordReset: Got request to send Password Reset for email ${request.recipientEmail}` );
    await this.mailService.sendPasswordResetEmail(request);
    this.logger.log(`sendPasswordReset: Successfully sent Password Reset Email to ${request.recipientEmail}`);
  }
}
