import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserStatus } from '@pokehub/user/database';
import { UserController } from './user.controller';
import { LoggerModule } from '@pokehub/common/logger';
import { ObjectStoreModule } from '@pokehub/common/object-store';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserStatus]), LoggerModule, ObjectStoreModule, CommonModule],
  controllers: [UserController],
})
export class UserModule {}
