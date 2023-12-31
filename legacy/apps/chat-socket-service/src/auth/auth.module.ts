import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AUTH_SERVICE } from './auth-service.interface';
import { AuthService } from './auth.service';

@Module({
  imports: [CommonModule, HttpModule],
  providers: [{ useClass: AuthService, provide: AUTH_SERVICE }],
  exports: [{ useClass: AuthService, provide: AUTH_SERVICE }]
})
export class AuthModule {}
