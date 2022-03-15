import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '@pokehub/common/logger';
import { ObjectStoreModule } from '@pokehub/common/object-store';
import { User, UserStatus } from '@pokehub/user/database';
import { USER_SERVICE } from './user-service.interface';
import { USER_STATUS_SERVICE } from './user-status-service.interface';
import { UserStatusService } from './user-status.service';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserStatus]), LoggerModule, ObjectStoreModule],
    providers: [{ useClass: UserService, provide: USER_SERVICE },
                { useClass: UserStatusService, provide: USER_STATUS_SERVICE }],
    exports: [{ useClass: UserService, provide: USER_SERVICE },
              { useClass: UserStatusService, provide: USER_STATUS_SERVICE },]
})
export class CommonModule {}
