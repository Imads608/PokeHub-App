import { Module } from '@nestjs/common';
import { BattlesDBModule } from '@pokehub/backend/pokehub-battles-db';
import { PokehubRedisModule } from '@pokehub/backend/pokehub-redis';
import { TeamsDBModule } from '@pokehub/backend/pokehub-teams-db';
import { UsersDBModule } from '@pokehub/backend/pokehub-users-db';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';
import { CommonModule } from '../common/common.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { BattleManagerServiceProvider } from './services/battle-manager/battle-manager.service';
import { BattlePersistenceServiceProvider } from './services/battle-persistence/battle-persistence.service';
import { MatchmakingServiceProvider } from './services/matchmaking/matchmaking.service';
import { TurnTimerServiceProvider } from './services/turn-timer/turn-timer.service';
import { BattleGateway } from './battle.gateway';

@Module({
  imports: [
    CommonModule,
    SharedAuthUtilsModule,
    PokehubRedisModule,
    BattlesDBModule,
    TeamsDBModule,
    UsersDBModule,
  ],
  providers: [
    WsJwtGuard,
    TurnTimerServiceProvider,
    MatchmakingServiceProvider,
    BattleManagerServiceProvider,
    BattlePersistenceServiceProvider,
    BattleGateway,
  ],
  exports: [],
})
export class BattleModule {}
