import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  CreateUserRequest,
  UserDataWithToken,
  UserPublicProfile,
  UserPublicProfileWithToken,
} from '@pokehub/user';
import { CreateUserInterceptor } from './create-user.interceptor';
import { User } from '../common/user.decorator';
import { AuthGuard } from '../common/auth.guard';
import { LoginInterceptor } from '../auth/login.interceptor';
import { IUserService, USER_SERVICE } from './user-service.interface';
import { AppLogger } from '@pokehub/logger';
import { IMailService, MAIL_SERVICE } from '../mail/mail-service.interface';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { JwtTokenBody } from '@pokehub/auth';

@Controller()
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: IUserService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
    @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
    private readonly logger: AppLogger
  ) {
    logger.setContext(UserController.name);
  }

  @UseInterceptors(CreateUserInterceptor)
  @Post()
  async create(
    @Body() createUserData: CreateUserRequest
  ): Promise<UserPublicProfileWithToken> {
    // Creates the User
    this.logger.log(
      `create: Got request to create new User with username ${createUserData.username}`
    );
    const userWithToken: UserDataWithToken = await this.userService.createUser(
      createUserData
    );

    // Generates Email Verification Token
    const token: { email_verification_token: string } =
      await this.authService.generateEmailVerficationToken(
        new JwtTokenBody(
          userWithToken.user.username,
          userWithToken.user.email,
          userWithToken.user.uid
        )
      );
    this.logger.log(
      `create: Successfully created Email Verification Token for User: ${userWithToken.user.uid}`
    );

    // Send Email Confirmation
    await this.mailService.sendEmailConfirmation(
      userWithToken.user.email,
      token.email_verification_token
    );
    this.logger.log(
      `create: Successfully sent Email Confirmation Link for User: ${userWithToken.user.uid}`
    );

    // Returns The User Data
    return new UserPublicProfileWithToken(
      userWithToken.user,
      userWithToken.accessToken,
      userWithToken.refreshToken,
      null
    );
  }

  @UseInterceptors(LoginInterceptor)
  @UseGuards(AuthGuard)
  @Get('auth')
  loadUser(@Req() req: Request, @User() user): Promise<UserPublicProfile> {
    this.logger.log(`loadUser: Got request to load user with uid ${user.uid}`);
    return this.userService.loadUser(user.uid);
  }

  @UseInterceptors(LoginInterceptor)
  @Get('activate')
  async activateUser(@Req() req: Request) {
    if (!req.headers['authorization']) throw new UnauthorizedException();
    return await this.userService.activateUser(req.headers['authorization']);
  }
}
