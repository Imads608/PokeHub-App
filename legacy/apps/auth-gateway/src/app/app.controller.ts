import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { JwtTokenBody } from '@pokehub/auth/models';
import { JwtAccessTokenAuthGuard } from '../common/jwt-access-token-auth.guard';
import { Request } from 'express';
import { AppLogger } from '@pokehub/common/logger';
import { JwtRefreshTokenAuthGuard } from '../common/jwt-refresh-token-auth.guard';
import { IJwtAuthService, JWT_AUTH_SERVICE } from '../common/jwt-auth-service.interface';

@Controller('')
export class AppController {
    constructor(private readonly logger: AppLogger, @Inject(JWT_AUTH_SERVICE) private readonly jwtService: IJwtAuthService) {
        this.logger.setContext(AppController.name);
    }

    @UseGuards(JwtAccessTokenAuthGuard)
    @Get('auth')
    async authUser(@Req() req: Request): Promise<JwtTokenBody> {
        return req.user as JwtTokenBody;
    }

    @UseGuards(JwtRefreshTokenAuthGuard)
    @Get('access-token')
    async getAccessToken(@Req() req: Request): Promise<{ access_token: string }> {
        return req.user as { access_token: string }
    }
}
