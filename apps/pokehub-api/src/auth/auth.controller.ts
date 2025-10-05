import { IUsersService, USERS_SERVICE } from '../users/users.service.interface';
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
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
    @Inject(USERS_SERVICE) private readonly usersService: IUsersService
  ) {
    logger.setContext(AuthController.name);
  }

  @Get('oauth-login')
  @UseGuards(GoogleOAuthGuard)
  async login(@User() user: { email: string }) {
    this.logger.log(`User logged in ${user.email}`);
    const userRes = await this.authService.createOrLoginUser(user.email);
    this.logger.log('Returning user data');
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

  @Get('load-user')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async loadUser(@User() user: UserJwtData) {
    this.logger.log(`Loading user core data`);
    return await this.usersService.getUserCore(user.id, 'id');
  }
}
