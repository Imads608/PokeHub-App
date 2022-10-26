import { Body, Controller, Get, Inject, Logger, Param, Redirect, Post, Query, Req, Res, UnauthorizedException, UseGuards, UseInterceptors, } from '@nestjs/common';
import { AuthService } from '../common/auth.service';
import { LoginInterceptor } from './login.interceptor';
import { UsernameLogin, EmailLogin, JwtTokenBody } from '@pokehub/auth/models';
import { TokenTypes } from '@pokehub/auth/interfaces';
import { AuthGuard } from '@nestjs/passport';
import { UserDataWithToken, UserProfileWithToken } from '@pokehub/user/models';
import { OauthInterceptor } from './oauth.interceptor';
import { RoomService } from '../chat/common/room.service';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { AppLogger } from '@pokehub/common/logger';
import { IRoomService, ROOM_SERVICE, } from '../chat/common/room-service.interface';
import { MAIL_SERVICE, IMailService } from '../common/mail-service.interface';
import { TokenValidatorInterceptor } from './token-validator.interceptor';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGatewayRESTEndpoints } from '@pokehub/auth/endpoints';

@Controller()
export class AuthController {
  private authGatewayURL: string;
  constructor(@Inject(AUTH_SERVICE) private readonly authService: IAuthService, @Inject(ROOM_SERVICE) private readonly roomService: IRoomService,
              @Inject(MAIL_SERVICE) private readonly mailService: IMailService, private readonly logger: AppLogger,
              private readonly configService: ConfigService) {
    this.authGatewayURL = `${configService.get<string>('protocol')}://${configService.get<string>('authGateway.host')}:${configService.get<number>('authGateway.restPort')}`;
    logger.setContext(AuthController.name);
  }

  @UseInterceptors(LoginInterceptor)
  @Post('login')
  async login( @Body() loginCreds: UsernameLogin | EmailLogin, @Res() res: Response ): Promise<Response<UserProfileWithToken>> {
    // Validate Credentials
    this.logger.log(`login: Got request to login user`);
    const userWithToken = await this.authService.loginUser(loginCreds);

    if (!userWithToken.user.emailVerified) {
      this.logger.log( `login: User ${userWithToken.user.uid} has not verified his email address. Generating Email Verification Token and sending email` );
      const token = await this.authService.generateEmailVerficationToken(new JwtTokenBody( userWithToken.user.username, userWithToken.user.email, userWithToken.user.uid));
      await this.mailService.sendEmailConfirmation(userWithToken.user.email, token.email_verification_token);
      this.logger.log( `login: Successfully generated Verification Token and Sent email to activate account` );
      return res.send(new UserProfileWithToken( userWithToken.user, null, null ));
    }

    // Retrieve Rooms User has joined
    this.logger.log( `login: Successfully authenticated user. Retrieving Rooms user has joined` );
    const joinedRooms = await this.roomService.getJoinedPublicRoomsForUser( userWithToken.user.uid );

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }).cookie('refreshToken', userWithToken.refreshToken.token, {
      maxAge: userWithToken.refreshToken.expirySeconds*1000,
      httpOnly: true,
      sameSite: true
    });
    
    return res.send(new UserProfileWithToken(userWithToken.user, userWithToken.accessToken, joinedRooms));
  }

  @UseInterceptors(OauthInterceptor)
  @Redirect('http://localhost:3013/google-oauth', 302)
  @Get('oauth-google-login')
  async googleOAuthLogin( @Req() req: Request, @Res() res: Response) {
    return { url: `${this.authGatewayURL}${AuthGatewayRESTEndpoints.GOOGLE_OAUTH_LOGIN}` };
  }

  @Post('logout')
  logoutUser(@Res() res: Response): Response<{ message: string }> {
    // Return User Data
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }).cookie('refreshToken', null, {
      expires: new Date(),
      httpOnly: true,
      sameSite: true
    });

    return res.send({ message: 'Logged Out' });
  }

  @UseInterceptors(LoginInterceptor)
  @Get('access-token')
  async getAccessToken(@Req() req: Request): Promise<{ access_token: string }> {
    this.logger.log( `getAccessToken: Got request to generate Access Token for user` );
    if (!req.cookies['refreshToken']) {
      this.logger.log(`getAccessToken: No Refresh Token Provided, Unauthorizing user`);
      throw new UnauthorizedException();
    }
    return await this.authService.getNewAccessToken( req.cookies['refreshToken']);
  }

  @UseInterceptors(TokenValidatorInterceptor)
  @Get('token-validation')
  async tokenValidation(@Query('token') token: string, @Query('tokenType') tokenType: TokenTypes): Promise<boolean> {
    let data: JwtTokenBody | { email: string } = null;
    this.logger.log( `tokenValidation: Got request to validate token with Token Type ${tokenType}` );
    if (tokenType === TokenTypes.ACCESS_TOKEN) {
        this.logger.log(`tokenValidation: Going to validate access token`);
        data = await this.authService.decodeToken(token);
    } else if (tokenType === TokenTypes.PASSWORD_RESET_TOKEN) {
        this.logger.log(`tokenValidation: Going to validate Password Reset Token`);
        data = await this.authService.validatePasswordResetToken(token);
    } else if (tokenType === TokenTypes.ACCOUNT_ACTIVATION_TOKEN) {
        this.logger.log(`tokenValidation: Going to validate Account Activation Token`);
        data = await this.authService.validateEmailConfirmationToken(token);
    }
    this.logger.log(`tokenValidation: Successfully validated token`);
    return !!data;
  }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    this.logger.log( `googleAuthRedirect: On Redirect from OAuth Authentication` );
    return 'authenticated';
  }
}
