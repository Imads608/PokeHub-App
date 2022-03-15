import { Inject, Injectable, UnauthorizedException, InternalServerErrorException } from "@nestjs/common";
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { EmailLogin } from "@pokehub/auth/models";
import { UserDataWithToken } from "@pokehub/user/models";
import { ILocalService, LOCAL_SERVICE } from "./local-service.interface";
import { AppLogger } from "@pokehub/common/logger";

@Injectable()
export class LocalEmailStrategy extends PassportStrategy(Strategy, 'local-email') {
  constructor(@Inject(LOCAL_SERVICE) private readonly localService: ILocalService, private readonly logger: AppLogger) {
    super({ usernameField: 'email' });
    this.logger.setContext(LocalEmailStrategy.name);
  }

  async validate(email: string, password: string): Promise<UserDataWithToken> {
    try {
      this.logger.log(`validate: Validating Email Credentials for email ${email}`);

      const user = await this.localService.emailLogin(new EmailLogin(email, password));
  
      if(!user) {
        throw new UnauthorizedException();
      }
  
      this.logger.log(`validate: Successfully validated Email Credentials for email ${email}`);
      return user;
    } catch (err) {
      this.logger.error(`validate: Got error while validating credentials: ${JSON.stringify(err)}`);
      if (err instanceof UnauthorizedException)
        throw err;
      throw new InternalServerErrorException();
    }
  }
}