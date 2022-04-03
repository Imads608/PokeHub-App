import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
  }), CommonModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
