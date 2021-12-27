import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import { JwtTokenBody } from '@pokehub/auth';
import { AppLogger } from '@pokehub/logger';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { IMailService, MAIL_SERVICE } from './mail-service.interface';

@Controller()
export class MailController {
  constructor(
    private readonly logger: AppLogger,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService
  ) {
    logger.setContext(MailController.name);
  }

  @Post('account-activation')
  async sendAccountActivationEmail(
    @Body() userData: JwtTokenBody
  ): Promise<void> {
    if (!userData) throw new BadRequestException();

    // Generate Email Verification Token
    this.logger.log(
      `sendAccountActivationEmail: Got request to send Account Activation Email for ${userData.uid}`
    );
    const token = await this.authService.generateEmailVerficationToken(
      userData
    );

    // Send Account Activation Email
    this.logger.log(
      `sendAccountActivationEmail: Sending Account Activation Email...`
    );
    await this.mailService.sendEmailConfirmation(
      userData.email,
      token.email_verification_token
    );
    this.logger.log(
      `sendAccountActivationEmail: Successfully sent Account Activation Email.`
    );
  }
}
