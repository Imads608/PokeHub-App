import { JWT_AUTH_SERVICE } from './jwt-service.interface';
import { JwtAuthService } from './jwt.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({
  imports: [AppLoggerModule, JwtModule.register({})],
  providers: [{ provide: JWT_AUTH_SERVICE, useClass: JwtAuthService }],
  exports: [JWT_AUTH_SERVICE],
})
export class SharedAuthUtilsModule {}
