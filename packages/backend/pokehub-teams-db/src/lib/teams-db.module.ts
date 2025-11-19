import { Module } from '@nestjs/common';
import { PokeHubPostgresModule } from '@pokehub/backend/pokehub-postgres';
import { TeamsDBService } from './teams-db.service';

@Module({
  imports: [PokeHubPostgresModule],
  providers: [TeamsDBService],
  exports: [TeamsDBService],
})
export class TeamsDBModule {}
