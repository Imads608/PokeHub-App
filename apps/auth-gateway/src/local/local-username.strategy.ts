import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { LocalService } from "./local.service";
import { EmailLogin, UsernameLogin } from "@pokehub/auth/models";
import { UserDataWithToken } from "@pokehub/user/models";
import { ILocalService, LOCAL_SERVICE } from "./local-service.interface";
import { AppLogger } from "@pokehub/common/logger";

@Injectable()
export class LocalUsernameStrategy extends PassportStrategy(Strategy, 'local-username') {
    constructor(@Inject(LOCAL_SERVICE) private readonly localService: ILocalService, private readonly logger: AppLogger) {
        super();
        this.logger.setContext(LocalUsernameStrategy.name);
    }

    async validate(username: string, password: string): Promise<UserDataWithToken> {
        try {
            this.logger.log(`validate: Validating Username Credentials for email ${username}`);
            const user = await this.localService.usernameLogin(new UsernameLogin(username, password));

            if (!user) {
                throw new UnauthorizedException();
            }

            this.logger.log(`validate: Successfully validated Username Credentials for username ${username}`);
            return user;
        } catch (err) {
            this.logger.error(`validate: Got error while validating user credentials with username: ${err.message}`, err.stack);
            if (err instanceof UnauthorizedException)
                throw err;
            throw new InternalServerErrorException();
        }
    }
}