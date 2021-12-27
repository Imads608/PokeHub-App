import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import configuration from '../config/configuration';

@Module({
  imports: [AuthModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration]
  })],
  controllers: [],
  providers: [],
})
export class AppModule {}
