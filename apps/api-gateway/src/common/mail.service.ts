import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppLogger } from '@pokehub/common/logger';
import { MailGatewayTCPEndpoints } from '@pokehub/mail/endpoints';
import { EmailConfirmationRequest, PasswordResetRequest } from '@pokehub/mail/models';
import { firstValueFrom } from 'rxjs';
import { IMailService } from './mail-service.interface';

@Injectable()
export class MailService implements IMailService {
  constructor(@Inject('MailGateway') private readonly clientProxy: ClientProxy,private readonly logger: AppLogger) {
    logger.setContext(MailService.name);
  }

  async sendEmailConfirmation(emailAddress: string, validationToken: string): Promise<void> {
    try {
      this.logger.log( `sendEmailConfirmation: Sending Email Confirmation Request to ${emailAddress}` );
      await firstValueFrom(this.clientProxy.send({ cmd: MailGatewayTCPEndpoints.SEND_EMAIL_CONFIRMATION }, new EmailConfirmationRequest(emailAddress, validationToken)))
            .catch((err) => { if (!err.message.includes('no elements in sequence')) throw err; });
    } catch (err) {
      this.logger.error(`sendEmailConfirmation: Got error while sending email confirmation request to ${emailAddress}: ${err.message}`, err.stack);
      throw err;
    }
  }

  async sendPasswordReset(emailAddress: string, resetToken: string): Promise<void> {
      try {
          this.logger.log(`sendPasswordReset: Sending Password Reset Request for ${emailAddress} to Mail Microservice`);
          await firstValueFrom(this.clientProxy.send({ cmd: MailGatewayTCPEndpoints.SEND_PASSWORD_RESET }, new PasswordResetRequest(emailAddress, resetToken)))
            .catch((err) => { if (!err.message.includes('no elements in sequence')) throw err; });
      } catch (err) {
        this.logger.error(`sendPasswordReset: Got error while sending password reset request to ${emailAddress}: ${err.message}`, err.stack);
      }
  }
}
