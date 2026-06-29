import { CommonModule } from '../common/common.module';
import { BattleGateway } from './battle.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsThrottlerGuard } from './guards/ws-throttler.guard';
import { BattleManagerServiceProvider } from './services/battle-manager/battle-manager.service';
import { BattlePersistenceServiceProvider } from './services/battle-persistence/battle-persistence.service';
import { BattleSocketBridgeServiceProvider } from './services/battle-socket-bridge/battle-socket-bridge.service';
import { MatchOrchestratorServiceProvider } from './services/match-orchestrator/match-orchestrator.service';
import { MatchmakingServiceProvider } from './services/matchmaking/matchmaking.service';
import { TurnTimerServiceProvider } from './services/turn-timer/turn-timer.service';
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BattlesDBModule } from '@pokehub/backend/pokehub-battles-db';
import { PokehubRedisModule } from '@pokehub/backend/pokehub-redis';
import { TeamsDBModule } from '@pokehub/backend/pokehub-teams-db';
import { UsersDBModule } from '@pokehub/backend/pokehub-users-db';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';

@Module({
  imports: [
    CommonModule,
    SharedAuthUtilsModule,
    PokehubRedisModule,
    BattlesDBModule,
    TeamsDBModule,
    UsersDBModule,
    /**
     * ThrottlerModule for WebSocket rate limiting.
     * Default limits are overridden per-handler using @WsThrottle decorator.
     *
     * Rate limits applied:
     * - MOVE: 2 requests per second (prevent spam clicking)
     * - FORFEIT: 1 request per 5 seconds (prevent accidental double-forfeit)
     * - JOIN_QUEUE/LEAVE_QUEUE: 10 requests per minute (prevent queue abuse)
     * - REJOIN: 5 requests per minute (prevent reconnect spam)
     * - SAVE_REPLAY: 5 requests per minute (prevent save spam)
     */
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000, // 1 minute default window
          limit: 60, // 60 requests per minute default
        },
      ],
    }),
  ],
  providers: [
    WsJwtGuard,
    WsThrottlerGuard,
    TurnTimerServiceProvider,
    MatchmakingServiceProvider,
    BattleManagerServiceProvider,
    BattlePersistenceServiceProvider,
    BattleSocketBridgeServiceProvider,
    MatchOrchestratorServiceProvider,
    BattleGateway,
  ],
  exports: [],
})
export class BattleModule {}
