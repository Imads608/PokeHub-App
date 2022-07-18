import { Module } from '@nestjs/common';
import { LoggerModule } from '@pokehub/common/logger';
import { ObjectStoreModule } from '@pokehub/common/object-store';
import { UserDBModule } from '@pokehub/user/database';
import { UTILS_SERVICE } from './utils-interface.service';
import { UtilsService } from './utils.service';

@Module({
    imports: [UserDBModule, LoggerModule, ObjectStoreModule],
    exports: [LoggerModule, UserDBModule, ObjectStoreModule, { useClass: UtilsService, provide: UTILS_SERVICE }],
    providers: [{ useClass: UtilsService, provide: UTILS_SERVICE }]
})
export class CommonModule {}
