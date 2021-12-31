import { BadRequestException, Body, Controller, Inject, Post, } from '@nestjs/common';
import { JwtTokenBody } from '@pokehub/auth';
import { AppLogger } from '@pokehub/logger';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { IMailService, MAIL_SERVICE } from '../common/mail-service.interface';
import { IUserService, USER_SERVICE } from '../user/user-service.interface';

@Controller()
export class MailController {
    constructor(private readonly logger: AppLogger, @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
                @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
                @Inject(USER_SERVICE) private readonly userService: IUserService) {
        logger.setContext(MailController.name);
    }

    @Post('account-activation')
    async sendAccountActivationEmail( @Body() userData: JwtTokenBody ): Promise<void> {
        if (!userData) throw new BadRequestException();

        // Generate Email Verification Token
        this.logger.log( `sendAccountActivationEmail: Got request to send Account Activation Email for ${userData.uid}` );
        const token = await this.authService.generateEmailVerficationToken( userData );

        // Send Account Activation Email
        this.logger.log( `sendAccountActivationEmail: Sending Account Activation Email...` );
        await this.mailService.sendEmailConfirmation( userData.email, token.email_verification_token );
        this.logger.log( `sendAccountActivationEmail: Successfully sent Account Activation Email.` );
    }

    @Post('password-reset')
    async sendPasswordResetEmail(@Body() reqBody: { email: string }): Promise<void> {
        if (!reqBody) throw new BadRequestException();

        this.logger.log(`sendPasswordResetEmail: Sending Password Reset Email to ${reqBody.email}`);

        // Check if Email Address already exists
        const exists = await this.userService.doesUserExist(reqBody.email);
        if (!exists) {
            this.logger.log(`sendPasswordResetEmail: Not sending email due to user not existing...`);
            return;
        }

        // Generate Password Reset Token
        this.logger.log( `sendPasswordResetEmail: Got request to send Password Reset Email for ${reqBody.email}` );
        const token = await this.authService.generatePasswordResetToken(reqBody);

        // Send Password Reset Email
        this.logger.log(`sendPasswordResetEmail: Sending Password Reset Email...`);
        await this.mailService.sendPasswordReset(reqBody.email, token.password_reset_token);
        this.logger.log(`sendPasswordResetEmail: Successfully sent Password Reset Email to user ${reqBody.email}`);
    }
}
