import { UsersDBProvider } from './users-db.service';
import { Module } from '@nestjs/common';
import { PokeHubPostgresModule } from '@pokehub/backend/pokehub-postgres';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({
  imports: [AppLoggerModule, PokeHubPostgresModule],
  providers: [UsersDBProvider],
  exports: [UsersDBProvider],
})
export class UsersDBModule {}
