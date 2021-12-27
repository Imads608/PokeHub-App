import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { AppLogger } from '@pokehub/logger';
import { EmailConfirmationRequest } from '@pokehub/mail';
import { ConfigService } from '@nestjs/config';
import { IMailService } from './mail-service.interface';

@Injectable()
export class MailService implements IMailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger
  ) {
    logger.setContext(MailService.name);
  }

  async sendEmailConfirmation(
    recipient: EmailConfirmationRequest
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: recipient.recipientEmail,
      from: 'no-reply@pokehub.com', //his.configService.get<string>('smtpConfig.email'),
      subject: 'PokeHub - Activate Account',
      text: 'Thanks for signing up',
      html: `
                <h3>Hello ${recipient.recipientEmail}</h3>
                <p>Thank you for registering into PokeHub.</p>
                <p>To activate your account, please follow the link to complete registration: 
                <a target="_" href="${this.configService.get<string>(
                  'frontendDetails.host'
                )}:
                ${this.configService.get<string>(
                  'frontendDetails.port'
                )}${this.configService.get<string>(
        'emailVerificationEndpoint'
      )}?activation_token=${recipient.linkValidationToken}"
            `,
    });
  }
}
