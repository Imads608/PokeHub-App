import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { TCPEndpoints, EmailConfirmationRequest } from '@pokehub/mail';
import { AppLogger } from '@pokehub/logger';
import { IMailService, MAIL_SERVICE } from './mail-service.interface';

@Controller()
export class MailController {

    constructor(@Inject(MAIL_SERVICE) private mailService: IMailService, private readonly logger: AppLogger) {
        logger.setContext(MailController.name);
    }

    @MessagePattern({ cmd: TCPEndpoints.SEND_EMAIL_CONFIRMATION }, Transport.TCP)
    async sendEmailConfirmation(request: EmailConfirmationRequest ): Promise<void> {
        this.logger.log(`sendEmailConfirmation: Got request to send Email Confirmation for email ${request.recipientEmail}`);
        await this.mailService.sendEmailConfirmation(request);
    }
}
