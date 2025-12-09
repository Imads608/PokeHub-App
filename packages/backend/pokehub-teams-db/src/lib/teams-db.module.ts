import { TeamsDBProvider } from './teams-db.service';
import { Module } from '@nestjs/common';
import { PokeHubPostgresModule } from '@pokehub/backend/pokehub-postgres';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({
  imports: [AppLoggerModule, PokeHubPostgresModule],
  providers: [TeamsDBProvider],
  exports: [TeamsDBProvider],
})
export class TeamsDBModule {}

