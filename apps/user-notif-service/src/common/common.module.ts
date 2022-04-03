import { Module } from '@nestjs/common';
import { LoggerModule } from '@pokehub/common/logger';
import { UserDBModule } from '@pokehub/user/database';

@Module({
    imports: [LoggerModule, UserDBModule],
    exports: [LoggerModule, UserDBModule]
})
export class CommonModule {}
