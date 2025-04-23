import type { IAuthService } from './auth.service.interface';
import { AUTH_SERVICE } from './auth.service.interface';
import { GoogleOAuthGuard } from './google-oauth.guard';
import { User } from './user.decorator';
import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import {
  TokenAuth,
  TokenAuthGuard,
  UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';

@Controller()
export class AuthController {
  constructor(
    private readonly logger: AppLogger,
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService
  ) {
    logger.setContext(AuthController.name);
  }

  @Get('oauth-login')
  @UseGuards(GoogleOAuthGuard)
  async login(@User() user: { email: string }) {
    this.logger.log(`User logged in ${user.email}`);
    const userRes = await this.authService.createOrLoginUser(user.email);
    return userRes;
  }

  @Get('access-token')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('REFRESH_TOKEN')
  async refreshAccessToken(@User() user: UserJwtData) {
    this.logger.log(`Useh ${user.email} requested access token`);
    const token = await this.authService.refreshAccessToken(user);
    return token;
  }
}
