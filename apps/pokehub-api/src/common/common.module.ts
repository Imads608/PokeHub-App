import { Module } from '@nestjs/common';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({
  imports: [AppLoggerModule],
  exports: [AppLoggerModule],
})
export class CommonModule {}
