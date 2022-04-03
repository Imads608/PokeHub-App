import { Module } from '@nestjs/common';
import { JwtAuthService } from './jwt-auth.service';
import { LoggerModule } from '@pokehub/common/logger';
import { JWT_AUTH_SERVICE } from './jwt-auth-service.interface';
import { JwtModule } from '@nestjs/jwt';
import { JwtRefreshTokenStrategy } from './jwt-refresh-token.strategy';
import { JwtAccessTokenStrategy } from './jwt-access-token.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
    providers: [{ useClass: JwtAuthService, provide: JWT_AUTH_SERVICE }, JwtAccessTokenStrategy, JwtRefreshTokenStrategy],
    exports: [{ useClass: JwtAuthService, provide: JWT_AUTH_SERVICE }, LoggerModule],
    imports: [PassportModule, LoggerModule, JwtModule.register({})]
})
export class CommonModule {}
