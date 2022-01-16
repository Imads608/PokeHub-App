import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserStatus } from '@pokehub/user/database';
import { UserController } from './user.controller';
import { UserStatusService } from './user-status.service';
import { LoggerModule } from '@pokehub/common/logger';
import { USER_SERVICE } from './user-service.interface';
import { USER_STATUS_SERVICE } from './user-status-service.interface';
import { ObjectStoreModule } from '@pokehub/common/object-store';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserStatus]), LoggerModule, ObjectStoreModule],
  providers: [
    { useClass: UserService, provide: USER_SERVICE },
    { useClass: UserStatusService, provide: USER_STATUS_SERVICE },
  ],
  controllers: [UserController],
})
export class UserModule {}
