import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { UserModule } from '../user/user.module';

@Module({
  imports: [CommonModule, UserModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
  })],
})
export class AppModule {}
