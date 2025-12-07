import { CommonModule } from '../common/common.module';
import { TeamsController } from './teams.controller';
import { TeamsServiceProvider } from './teams.service.provider';
import { Module } from '@nestjs/common';
import { TeamsDBModule } from '@pokehub/backend/pokehub-teams-db';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';

@Module({
  imports: [CommonModule, SharedAuthUtilsModule, TeamsDBModule],
  controllers: [TeamsController],
  providers: [TeamsServiceProvider],
  exports: [],
})
export class TeamsModule {}
