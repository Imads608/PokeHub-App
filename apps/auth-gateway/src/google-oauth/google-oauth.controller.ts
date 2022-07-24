import { Controller, Get, Inject, Redirect, Req, UseGuards } from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { GoogleAuthGuard } from './google-oauth.guard';
import { Request } from 'express';
import { UserDataWithToken } from '@pokehub/user/models';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';
import { ConfigService } from '@nestjs/config';

@Controller('google-oauth')
export class GoogleOauthController {
    constructor(private readonly logger: AppLogger, @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService,
                private readonly configService: ConfigService) {
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
        this.logger.log(`googleAuthRedirect: Got redirected from Google OAuth`);
        const user = req.user as UserDataWithToken;
        const token = await this.jwtService.getNewOAuthTokenFromPayload({ uid: user.user.uid, email: user.user.email, username: user.user.username });
        const url = `${this.configService.get<string>('protocol')}://${this.configService.get<string>('frontendApp.host')}:${this.configService.get<string>('frontendApp.port')}/login?oauth_token=${token.oauth_token}`;
        this.logger.log(`googleAuthRedirect: Url: ${url}`)
        return { url };
        //return { url: `http://localhost:4200/login?oauth_token=${token.oauth_token}` };
    }
}
