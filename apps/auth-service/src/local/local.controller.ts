import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AppLogger } from '@pokehub/common/logger';
import { UserDataWithToken } from '@pokehub/user/models';
import { LocalEmailAuthGuard } from './local-email.guard';
import { ILocalService, LOCAL_SERVICE } from './local-service.interface';
import { LocalUsernameAuthGuard } from './local-username.guard';
import { Request } from 'express'
import { JwtAccessTokenAuthGuard } from '../common/jwt-access-token-auth.guard';
import { JwtTokenBody } from '@pokehub/auth/models';

@Controller('local')
export class LocalController {
    constructor(private readonly logger: AppLogger) {
        this.logger.setContext(LocalController.name);
    }

    @UseGuards(LocalEmailAuthGuard)
    @Post('login/email')
    async loginEmail( @Req() req: Request): Promise<UserDataWithToken> {
        return req.user as UserDataWithToken;
    }

    @UseGuards(LocalUsernameAuthGuard)
    @Post('login/username')
    async loginUsername( @Req() req: Request): Promise<UserDataWithToken> {
        return req.user as UserDataWithToken;
    }
}
