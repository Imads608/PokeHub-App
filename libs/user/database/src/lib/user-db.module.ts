import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserStatus } from './entities/user-status.entity';
import { LoggerModule } from '@pokehub/common/logger';
import { UserStatusService } from './services/user-status.service';
import { USER_STATUS_SERVICE } from './services/user-status-service.interface';
import { UserService } from './services/user.service';
import { USER_SERVICE } from './services/user-service.interface';
import { UsernameGeneratorService } from './utils/username-gen.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserStatus]), LoggerModule],
  providers: [{ useClass: UserStatusService, provide: USER_STATUS_SERVICE }, { useClass: UserService, provide: USER_SERVICE }, UsernameGeneratorService],
  exports: [{ useClass: UserStatusService, provide: USER_STATUS_SERVICE }, { useClass: UserService, provide: USER_SERVICE }]
})
export class UserDBModule {}
