import { BadRequestException, Body, Controller, Get, Head, HttpCode, Inject, NotFoundException, Param, Post, Put, Query, Req, Res, UnauthorizedException, UploadedFile, UploadedFiles, UseGuards, UseInterceptors, } from '@nestjs/common';
import { CreateUserRequest, UserData, UserDataWithToken, UserProfile, UserProfileWithToken, UserPublicProfile, } from '@pokehub/user/models';
import { CreateUserInterceptor } from './create-user.interceptor';
import { User } from '../common/user.decorator';
import { AuthGuard } from '../common/auth.guard';
import { LoginInterceptor } from '../auth/login.interceptor';
import { IUserService, USER_SERVICE } from './user-service.interface';
import { AppLogger } from '@pokehub/common/logger';
import { IMailService, MAIL_SERVICE } from '../common/mail-service.interface';
import { AUTH_SERVICE, IAuthService } from '../common/auth-service.interface';
import { JwtTokenBody, OAuthTokenBody } from '@pokehub/auth/models';
import { ActivateUserInterceptor } from './activate-user.interceptor';
import { UserIdTypes } from '@pokehub/user/interfaces';
import { ResourceInterceptor } from '../common/resource.interceptor';
import { Express, Response, Request } from 'express';
import { Multer } from 'multer';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { unlinkSync } from 'fs';
import * as path from 'path';
import { OAuthGuard } from '../common/oauth.guard';

@Controller()
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: IUserService,
              @Inject(MAIL_SERVICE) private readonly mailService: IMailService, @Inject(AUTH_SERVICE) private readonly authService: IAuthService,
              private readonly httpService: HttpService,
              private readonly configService: ConfigService, private readonly logger: AppLogger) {
    logger.setContext(UserController.name);
  }

  @UseInterceptors(CreateUserInterceptor)
  @Post()
  async create( @Body() createUserData: CreateUserRequest ): Promise<UserProfileWithToken> {
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
    return new UserProfileWithToken( userWithToken.user, userWithToken.accessToken, null);
  }

  @UseInterceptors(LoginInterceptor)
  @UseGuards(AuthGuard)
  @Get('auth')
  loadUser(@Req() req: Request, @User() user: JwtTokenBody): Promise<UserProfile> {
    this.logger.log(`loadUser: Got request to load user with uid ${user.uid}`);
    return this.userService.loadUser(user.uid);
  }

  @UseInterceptors(LoginInterceptor)
  @UseGuards(OAuthGuard)
  @Get('oauth-load')
  async oauthLoadUser(@Req() req: Request, @User() user: OAuthTokenBody, @Res() res: Response): Promise<Response<UserProfileWithToken>> {
    this.logger.log(`oauthLoadUser: Got request to load user with uid ${user.uid}`);
    const data = await this.userService.loadUser(user.uid);
    const userWithToken = new UserProfileWithToken(data.user, user.accessToken, data.joinedPublicRooms);

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }).cookie('refreshToken', user.refreshToken.token, {
      maxAge: user.refreshToken.expirySeconds*1000,
      httpOnly: true,
      sameSite: true
    });

    return res.send(userWithToken);
  }

  @UseInterceptors(ActivateUserInterceptor)
  @Get('auth/activate')
  async activateUser(@Req() req: Request): Promise<UserData> {
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

  @UseInterceptors(ResourceInterceptor)
  @UseGuards(AuthGuard)
  @Put(':userId')
  async updateUser(@Body('user') userData: UserData, @User() user: JwtTokenBody, @Param('userId') userId: string): Promise<UserData> {
    if (user.uid != userId)
      throw new UnauthorizedException();
    else if (!userData)
      throw new BadRequestException();

    this.logger.log(`updateUser: Got request to update User Data with uid ${user.uid}`);
    return await this.userService.updateUserData(userData);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ResourceInterceptor)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
  ]))
  @Put(':userId/profile')
  async updateUserProfile(@User() user: JwtTokenBody, @Param('userId') userId: string, @Body('user') userJsonStr: string, @UploadedFiles() data: { avatar?: Express.Multer.File[] }): Promise<UserData> {
    this.logger.log(`updateUser: Got request to update profile: ${data.avatar?.[0].originalname}`);

    // Handle Failure Scenarios
    if (user.uid != userId)
      throw new UnauthorizedException();
    else if (!data || !userJsonStr)
      throw new BadRequestException();
    else if (data.avatar && data.avatar.length > 0) {
      const ext = path.extname(data.avatar[0].originalname);
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' || (!data.avatar[0].originalname && !data.avatar[0].filename)) {
        throw new BadRequestException({ statusCode: 400, message: "Not a valid profile image"});
      }
    }
    const userObj = JSON.parse(userJsonStr);

    return await this.userService.updateUserProfile(userId, { ...data, user: userObj });
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ResourceInterceptor)
  @UseInterceptors(FileInterceptor('avatar', { 
    dest: './upload',
    fileFilter: (req, file, callback) => {
      const ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'), false);
        }
        callback(null, true)
    } 
  }))
  @Post(':userId/avatar')
  async updateUserAvatar(@User() user: JwtTokenBody, @UploadedFile() avatar: Express.Multer.File, @Param('userId') userId: string): Promise<UserData> {
    this.logger.log(`updateUserAvatar: Got request to update User Avatar`);

    if (user.uid !== userId)
      throw new UnauthorizedException();

    const updatedData = await this.userService.updateUserAvatar(userId, avatar);

    // Delete Temporary Image File
    unlinkSync(avatar.path);

    return updatedData;
  }

  @HttpCode(204)
  @Head(':userId')
  async checkUserExists(@Param('userId') userId: string, @Query('typeId') typeId: UserIdTypes): Promise<void> {
    if (!typeId) typeId = UserIdTypes.UID;
    
    const exists = await this.userService.doesUserExist(userId, typeId);
    if (!exists) throw new NotFoundException();
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ResourceInterceptor)
  @Get(':userId')
  async getUser(@Param('userId') userId: string, @User() user: JwtTokenBody): Promise<UserPublicProfile | UserProfile> {
    this.logger.log(`getUser: Got request to get user: ${userId}`);
    if (user.uid === userId)
      return this.userService.loadUser(userId);
    return this.userService.getUserPublicProfile(userId);
  }
}
