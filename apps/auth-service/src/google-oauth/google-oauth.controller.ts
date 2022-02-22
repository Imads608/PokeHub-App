import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { GoogleAuthGuard } from './google-oauth.guard';
import { Request } from 'express';
import { UserDataWithToken } from '@pokehub/user/models';

@Controller('google-oauth')
export class GoogleOauthController {
    constructor(private readonly logger: AppLogger) {
        this.logger.setContext(GoogleOauthController.name);
    }

    @Get()
    @UseGuards(GoogleAuthGuard)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async googleAuth(@Req() req: Request) {}

    @Get('redirect')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Req() req: Request): Promise<UserDataWithToken> {
        this.logger.log(`googleAuthRedirect: Got redirected from Google OAuth`);
        if (!req.user)
            return null;
        return req.user as UserDataWithToken;
    }
}
