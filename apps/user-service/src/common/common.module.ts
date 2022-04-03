import { Module } from '@nestjs/common';
import { LoggerModule } from '@pokehub/common/logger';
import { ObjectStoreModule } from '@pokehub/common/object-store';
import { UserDBModule } from '@pokehub/user/database';

@Module({
    imports: [UserDBModule, LoggerModule, ObjectStoreModule],
    exports: [LoggerModule, UserDBModule, ObjectStoreModule]
})
export class CommonModule {}
