import { postgresProvider } from './postgres.service';
import { Module } from '@nestjs/common';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({
  imports: [AppLoggerModule],
  providers: [postgresProvider],
  exports: [postgresProvider],
})
export class PokeHubPostgresModule {}
