import { Controller, Get, Inject, Redirect, Req, UseGuards } from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { GoogleAuthGuard } from './google-oauth.guard';
import { Request } from 'express';
import { UserDataWithToken } from '@pokehub/user/models';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';

@Controller('google-oauth')
export class GoogleOauthController {
    constructor(private readonly logger: AppLogger, @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService) {
        this.logger.setContext(GoogleOauthController.name);
    }

    @Get()
    @UseGuards(GoogleAuthGuard)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async googleAuth(@Req() req: Request) {}

    @Get('redirect')
    @Redirect()
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Req() req: Request) {
        this.logger.log(`googleAuthRedirect: Got redirected from Google OAuth: ${req.isAuthenticated}, ${req.isUnauthenticated}, ${JSON.stringify(req.body)}, ${JSON.stringify(req.headers)}`);
        const user = req.user as UserDataWithToken;
        const token = await this.jwtService.getNewOAuthTokenFromPayload({ uid: user.user.uid, email: user.user.email, username: user.user.username });
        /*if (!req.user)
            return null;
        return req.user as UserDataWithToken;*/
        return { url: `http://localhost:4200/login?oauth_token=${token.oauth_token}` };
    }
}
