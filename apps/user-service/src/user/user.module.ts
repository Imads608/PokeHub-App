import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserStatus } from '@pokehub/user';
import { UserController } from './user.controller';
import { UserStatusService } from './user-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserStatus])],
  providers: [UserService, UserStatusService],
  controllers: [UserController],
})
export class UserModule {}
