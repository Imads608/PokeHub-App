import { BadRequestException, Body, Controller, Get, Head, HttpCode, Inject, NotFoundException, Param, Post, Query, Req, Res, UnauthorizedException, UseGuards, UseInterceptors, } from '@nestjs/common';
import { CreateUserRequest, UserData, UserDataWithToken, UserIdTypes, UserPublicProfile, UserPublicProfileWithToken, } from '@pokehub/user';
import { CreateUserInterceptor } from './create-user.interceptor';
import { User } from '../common/user.decorator';
import { AuthGuard } from '../common/auth.guard';
import { LoginInterceptor } from '../auth/login.interceptor';
import { IUserService, USER_SERVICE } from './user-service.interface';
import { AppLogger } from '@pokehub/logger';
import { IMailService, MAIL_SERVICE } from '../common/mail-service.interface';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { EmailLogin, JwtTokenBody } from '@pokehub/auth';
import { ActivateUserInterceptor } from './activate-user.interceptor';

@Controller()
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: IUserService,
              @Inject(MAIL_SERVICE) private readonly mailService: IMailService, @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
              private readonly logger: AppLogger) {
    logger.setContext(UserController.name);
  }

  @UseInterceptors(CreateUserInterceptor)
  @Post()
  async create( @Body() createUserData: CreateUserRequest ): Promise<UserPublicProfileWithToken> {
    // Creates the User
    this.logger.log( `create: Got request to create new User with username ${createUserData.username}` );
    const userWithToken: UserDataWithToken = await this.userService.createUser( createUserData );

    // Generates Email Verification Token
    const token: { email_verification_token: string } = await this.authService.generateEmailVerficationToken( new JwtTokenBody( userWithToken.user.username, userWithToken.user.email, userWithToken.user.uid ) );
    this.logger.log( `create: Successfully created Email Verification Token for User: ${userWithToken.user.uid}` );

    // Send Email Confirmation
    await this.mailService.sendEmailConfirmation( userWithToken.user.email, token.email_verification_token );
    this.logger.log( `create: Successfully sent Email Confirmation Link for User: ${userWithToken.user.uid}` );

    // Returns The User Data
    return new UserPublicProfileWithToken( userWithToken.user, userWithToken.accessToken, userWithToken.refreshToken, null );
  }

  @UseInterceptors(LoginInterceptor)
  @UseGuards(AuthGuard)
  @Get('auth')
  loadUser(@Req() req: Request, @User() user): Promise<UserPublicProfile> {
    this.logger.log(`loadUser: Got request to load user with uid ${user.uid}`);
    return this.userService.loadUser(user.uid);
  }

  @UseInterceptors(ActivateUserInterceptor)
  @Get('auth/activate')
  async activateUser(@Req() req: Request) {
    const token = req.headers['authorization'];
    if (!token) throw new UnauthorizedException();
    this.logger.log(`activateUser: Got request to activate user with token ${token}`);
    return await this.userService.activateUser(token);
  }

  @UseInterceptors(ActivateUserInterceptor)
  @Post('auth/password-reset')
  async passwordReset(@Req() req: Request, @Body() reqBody: { password: string }): Promise<UserData> {
    const token = req.headers['authorization'];
    if (!reqBody) throw new BadRequestException();
    else if (!token) throw new UnauthorizedException();
    this.logger.log(`passwordReset: Got request to reset Password of User`);
    return await this.userService.resetPassword(token, reqBody.password);
  }

  @HttpCode(204)
  @Head(':userId')
  async checkUserExists(@Param('userId') userId: string, @Query('typeId') typeId: UserIdTypes): Promise<void> {
    if (!typeId) typeId = UserIdTypes.UID;
    
    const exists = await this.userService.doesUserExist(userId, typeId);
    if (!exists) throw new NotFoundException();
  }
}
