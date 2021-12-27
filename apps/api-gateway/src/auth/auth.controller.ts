import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../common/auth.service';
import { LoginInterceptor } from './login.interceptor';
import { UsernameLogin, EmailLogin, JwtTokenBody } from '@pokehub/auth';
import { AuthGuard } from '@nestjs/passport';
import { UserDataWithToken, UserPublicProfileWithToken } from '@pokehub/user';
import { OauthInterceptor } from './oauth.interceptor';
import { RoomService } from '../chat/common/room.service';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { AppLogger } from '@pokehub/logger';
import {
  IRoomService,
  ROOM_SERVICE,
} from '../chat/common/room-service.interface';
import { MAIL_SERVICE, IMailService } from '../mail/mail-service.interface';

@Controller()
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
    @Inject(ROOM_SERVICE) private readonly roomService: IRoomService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    private readonly logger: AppLogger
  ) {
    logger.setContext(AuthController.name);
  }

  @UseInterceptors(LoginInterceptor)
  @Post('login')
  async login(
    @Body() loginCreds: UsernameLogin | EmailLogin
  ): Promise<UserPublicProfileWithToken> {
    // Validate Credentials
    this.logger.log(`login: Got request to login user`);
    const userWithToken = await this.authService.loginUser(loginCreds);

    if (!userWithToken.user.emailVerified) {
      this.logger.log(
        `login: User ${userWithToken.user.uid} has not verified his email address. Generating Email Verification Token and sending email`
      );
      const token = await this.authService.generateEmailVerficationToken(
        new JwtTokenBody(
          userWithToken.user.username,
          userWithToken.user.email,
          userWithToken.user.uid
        )
      );
      //await this.mailService.sendEmailConfirmation(userWithToken.user.email, token.email_verification_token);
      this.logger.log(
        `login: Successfully generated Verification Token and Sent email to activate account`
      );
      return new UserPublicProfileWithToken(
        userWithToken.user,
        null,
        null,
        null
      );
    }

    // Retrieve Rooms User has joined
    this.logger.log(
      `login: Successfully authenticated user. Retrieving Rooms user has joined`
    );
    const joinedRooms = await this.roomService.getJoinedPublicRoomsForUser(
      userWithToken.user.uid
    );

    // Return User Data
    return new UserPublicProfileWithToken(
      userWithToken.user,
      userWithToken.accessToken,
      userWithToken.refreshToken,
      joinedRooms
    );
  }

  @UseInterceptors(OauthInterceptor)
  @Post('oauth-google')
  async googleOAuthLogin(
    @Req() req: Request
  ): Promise<UserPublicProfileWithToken> {
    // Validate OAuth Credentials
    this.logger.log(
      `googleOAuthLogin: Got request to login user through Google OAuth`
    );
    const userWithToken: UserDataWithToken =
      await this.authService.googleOAuthLogin(req.headers['authorization']);

    // Retrieve Rooms User has joined
    this.logger.log(
      `googleOAuthLogin: Successfully authenticated user. Retrieving Rooms user has joined`
    );
    const joinedRooms = await this.roomService.getJoinedPublicRoomsForUser(
      userWithToken.user.uid
    );

    // Return User Data
    return new UserPublicProfileWithToken(
      userWithToken.user,
      userWithToken.accessToken,
      userWithToken.refreshToken,
      joinedRooms
    );
  }

  @UseInterceptors(LoginInterceptor)
  @Get('access-token')
  async getAccessToken(@Req() req: Request): Promise<{ access_token: string }> {
    this.logger.log(
      `getAccessToken: Got request to generate Access Token for user`
    );
    return await this.authService.getNewAccessToken(
      req.headers['authorization']
    );
  }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    this.logger.log(
      `googleAuthRedirect: On Redirect from OAuth Authentication`
    );
    return 'authenticated';
  }
}
