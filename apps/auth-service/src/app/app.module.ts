import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { GoogleOauthModule } from '../google-oauth/google-oauth.module';
import { LocalModule } from '../local/local.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    LocalModule,
    GoogleOauthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
