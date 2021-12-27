import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppLogger } from '@pokehub/logger';
import { TCPEndpoints, EmailConfirmationRequest } from '@pokehub/mail';
import { firstValueFrom } from 'rxjs';
import { IMailService } from './mail-service.interface';

@Injectable()
export class MailService implements IMailService {
  constructor(
    @Inject('MailMicroservice') private readonly clientProxy: ClientProxy,
    private readonly logger: AppLogger
  ) {
    logger.setContext(MailService.name);
  }

  async sendEmailConfirmation(
    emailAddress: string,
    validationToken: string
  ): Promise<void> {
    try {
      this.logger.log(
        `sendEmailConfirmation: Sending Email Confirmation Request to ${emailAddress}`
      );
      await firstValueFrom(
        this.clientProxy.send(
          { cmd: TCPEndpoints.SEND_EMAIL_CONFIRMATION },
          new EmailConfirmationRequest(emailAddress, validationToken)
        )
      ).catch((err) => {
        if (!err.message.includes('no elements in sequence')) throw err;
      });
    } catch (err) {
      this.logger.error(
        `sendEmailConfirmation: Got error while sending email confirmation request to ${emailAddress}: ${err}`
      );
      throw err;
    }
  }
}
