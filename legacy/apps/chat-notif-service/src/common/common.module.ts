import { Module } from '@nestjs/common';
import { LoggerModule } from '@pokehub/common/logger';

@Module({
    imports: [LoggerModule],
    exports: [LoggerModule]
})
export class CommonModule {}
