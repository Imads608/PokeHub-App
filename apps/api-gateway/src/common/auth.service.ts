import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserDataWithToken } from '@pokehub/user';
import {
  UsernameLogin,
  EmailLogin,
  AuthTokens,
  JwtTokenBody,
  TCPEndpoints,
} from '@pokehub/auth';
import { AppLogger } from '@pokehub/logger';
import { IAuthService } from './auth-service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('AuthMicroservice') private readonly clientProxy: ClientProxy,
    private readonly logger: AppLogger
  ) {
    logger.setContext(AuthService.name);
  }

  async googleOAuthLogin(token: string): Promise<UserDataWithToken> {
    this.logger.log(`googleOAuthLogin: Authenticating user with Google OAuth`);
    if (!token) throw new UnauthorizedException();

    try {
      const userDataWithToken = await firstValueFrom(
        this.clientProxy.send<UserDataWithToken>(
          { cmd: TCPEndpoints.GOOGLE_OAUTH_LOGIN },
          token
        )
      );
      if (!userDataWithToken) throw new InternalServerErrorException();

      this.logger.log(
        `googleOAuthLogin: Successfully authenticated user through Google OAuth`
      );
      return userDataWithToken;
    } catch (err) {
      this.logger.error(
        `googleOAuthLogin: Got error while authenticating user through Google OAuth: ${err}`
      );
      throw err;
    }
  }

  async loginUser(
    userCreds: EmailLogin | UsernameLogin
  ): Promise<UserDataWithToken> {
    this.logger.log(`loginUser: Validating User Credentials`);
    if (!this.isEmailLogin(userCreds) && !this.isUsernameLogin(userCreds))
      throw new BadRequestException();

    try {
      let userData: UserDataWithToken = null;
      if (this.isEmailLogin(userCreds)) {
        userData = await firstValueFrom(
          this.clientProxy.send<UserDataWithToken>(
            { cmd: TCPEndpoints.EMAIL_LOGIN },
            userCreds
          )
        );
      } else {
        userData = await firstValueFrom(
          this.clientProxy.send<UserDataWithToken>(
            { cmd: TCPEndpoints.USERNAME_LOGIN },
            userCreds
          )
        );
      }
      if (!userData) throw new InternalServerErrorException();

      this.logger.log(`loginUser: Successfully validated user credentials`);
      return userData;
    } catch (err) {
      this.logger.error(
        `loginUser: Got error while validating user credentials: ${err}`
      );
      throw err;
    }
  }

  async generateNewTokens(user: JwtTokenBody): Promise<AuthTokens> {
    this.logger.log(
      `generateNewTokens: Going to generate new Refresh & Access Tokens for user ${user.uid}`
    );
    try {
      const tokens = await firstValueFrom(
        this.clientProxy.send<AuthTokens>(
          { cmd: TCPEndpoints.GENERATE_TOKENS },
          user
        )
      );
      if (!tokens) throw new InternalServerErrorException();

      this.logger.log(
        `generateNewTokens: Successfully generated Access and Refresh Tokens for user ${user.uid}`
      );
      return tokens;
    } catch (err) {
      this.logger.error(
        `generateNewTokens: Got error while generating Refresh and Access Tokens for user ${user.uid}: ${err}`
      );
      throw err;
    }
  }

  async validateEmailConfirmationToken(
    verificationToken: string
  ): Promise<JwtTokenBody> {
    this.logger.log(
      `validateEmailConfirmationToken: Sending Validation Request to Auth Service`
    );

    try {
      const userData = await firstValueFrom(
        this.clientProxy.send<JwtTokenBody>(
          { cmd: TCPEndpoints.VALIDATE_EMAIL_CONFIRMATION_TOKEN },
          verificationToken
        )
      );
      if (!userData) throw new InternalServerErrorException();

      this.logger.log(
        `validateEmailConfirmationToken: Successfully decoded Email Confirmation Token to User Data`
      );
      return userData;
    } catch (err) {
      this.logger.error(
        `validateEmailConfirmationToken: Got error while decoding and validating Email Verification Token: ${err}`
      );
      throw err;
    }
  }

  async decodeToken(accessToken: string): Promise<JwtTokenBody> {
    this.logger.log(
      `decodeToken: Sending Access Token Validation Request to Auth Service`
    );

    try {
      const userData = await firstValueFrom(
        this.clientProxy.send<JwtTokenBody>(
          { cmd: TCPEndpoints.DECODE_TOKEN },
          accessToken
        )
      );
      if (!userData) throw new InternalServerErrorException();

      this.logger.log(
        `decodeToken: Successfully decoded Access Token to User Data`
      );
      return userData;
    } catch (err) {
      this.logger.error(
        `decodeToken: Got error while decoding and validating Access Token: ${err}`
      );
      throw err;
    }
  }

  async getNewAccessToken(
    refreshToken: string
  ): Promise<{ access_token: string }> {
    this.logger.log(
      `getNewAccessToken: Sending Request for New Access Token to Auth Service`
    );
    try {
      const token = await firstValueFrom(
        this.clientProxy.send<{ access_token: string }>(
          { cmd: TCPEndpoints.GET_ACCESS_TOKEN },
          refreshToken
        )
      );
      if (!token) throw new InternalServerErrorException();

      this.logger.log(
        `getNewAccessToken: Successfully generated Access Token from Refresh Token`
      );
      return token;
    } catch (err) {
      this.logger.error(
        `getNewAccessToken: Got error while trying to retrieve new Access Token from Refresh Token: ${err}`
      );
      throw err;
    }
  }

  async generateEmailVerficationToken(
    userData: JwtTokenBody
  ): Promise<{ email_verification_token: string }> {
    this.logger.log(
      `generateEmailVerficationToken: Sending Request for Email Verification Token to Auth Service`
    );
    try {
      const token = await firstValueFrom(
        this.clientProxy.send<{ email_verification_token: string }>(
          { cmd: TCPEndpoints.GET_EMAIL_VERIFICATION_TOKEN },
          userData
        )
      );
      if (!token) throw new InternalServerErrorException();

      this.logger.log(
        `generateEmailVerficationToken: Successfully generated Email Verification Token`
      );
      return token;
    } catch (err) {
      this.logger.error(
        `generateEmailVerficationToken: Got error while trying to generate new Email Verification Token: ${err}`
      );
      throw err;
    }
  }

  private isEmailLogin(userCreds: any): boolean {
    return userCreds.email !== undefined;
  }

  private isUsernameLogin(userCreds: any): boolean {
    return userCreds.username !== undefined;
  }
}
