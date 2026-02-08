import { Module } from '@nestjs/common';
import { PokeHubPostgresModule } from '@pokehub/backend/pokehub-postgres';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';
import { BattlesDBProvider } from './battles-db.service';

@Module({
  imports: [AppLoggerModule, PokeHubPostgresModule],
  providers: [BattlesDBProvider],
  exports: [BattlesDBProvider],
})
export class BattlesDBModule {}
