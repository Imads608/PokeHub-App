import { Inject, Injectable } from '@nestjs/common';
import {
  MATCH_ORCHESTRATOR_SERVICE,
  type IMatchOrchestratorService,
} from './match-orchestrator.service.interface';
import {
  BATTLE_SOCKET_BRIDGE_SERVICE,
  type IBattleSocketBridgeService,
} from '../battle-socket-bridge/battle-socket-bridge.service.interface';
import {
  BATTLE_MANAGER_SERVICE,
  type IBattleManagerService,
} from '../battle-manager/battle-manager.service.interface';
import {
  MATCHMAKING_SERVICE,
  type IMatchmakingService,
} from '../matchmaking/matchmaking.service.interface';
import {
  REDIS_SERVICE,
  type RedisService,
} from '@pokehub/backend/pokehub-redis';
import {
  USERS_DB_SERVICE,
  type IUsersDBService,
} from '@pokehub/backend/pokehub-users-db';
import {
  type BattleConfig,
  generateBattleSeed,
  BattleRooms,
} from '@pokehub/shared/pokemon-battle-types';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { randomUUID } from 'crypto';
import type { Provider } from '@nestjs/common';

@Injectable()
class MatchOrchestratorService implements IMatchOrchestratorService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(BATTLE_SOCKET_BRIDGE_SERVICE)
    private readonly bridge: IBattleSocketBridgeService,
    @Inject(MATCHMAKING_SERVICE)
    private readonly matchmaking: IMatchmakingService,
    @Inject(BATTLE_MANAGER_SERVICE)
    private readonly battleManager: IBattleManagerService,
    @Inject(REDIS_SERVICE) private readonly redis: RedisService,
    @Inject(USERS_DB_SERVICE) private readonly usersDb: IUsersDBService
  ) {
    this.logger.setContext(MatchOrchestratorService.name);
  }

  async tryFindMatch(format: string): Promise<void> {
    const match = await this.matchmaking.findMatch(format);
    if (!match) return;

    const { player1, player2 } = match;

    try {
      // Get player names
      const [user1, user2] = await Promise.all([
        this.usersDb.getUser(player1.userId),
        this.usersDb.getUser(player2.userId),
      ]);

      if (!user1 || !user2) {
        this.logger.error('Failed to get user info for match');
        return;
      }

      const user1Name =
        user1.username ?? `Player ${player1.userId.slice(0, 8)}`;
      const user2Name =
        user2.username ?? `Player ${player2.userId.slice(0, 8)}`;

      // Create battle config
      const battleId = randomUUID();
      const config: BattleConfig = {
        id: battleId,
        format,
        player1: {
          id: player1.userId,
          name: user1Name,
          teamId: player1.teamId,
          packedTeam: player1.packedTeam,
        },
        player2: {
          id: player2.userId,
          name: user2Name,
          teamId: player2.teamId,
          packedTeam: player2.packedTeam,
        },
        seed: generateBattleSeed(),
      };

      // Create the battle
      const battle = await this.battleManager.createBattle(config);

      // Subscribe to battle updates
      this.bridge.subscribeBattle(battleId);

      // Join local players to the battle room
      const server = this.bridge.getServer();
      const battleRoom = BattleRooms.battle(battleId);
      const socket1 = this.bridge.getSocketId(player1.userId);
      const socket2 = this.bridge.getSocketId(player2.userId);

      if (socket1) {
        const sockets1 = await server.in(socket1).fetchSockets();
        if (sockets1.length > 0) {
          await sockets1[0].join(battleRoom);
        }
      }
      if (socket2) {
        const sockets2 = await server.in(socket2).fetchSockets();
        if (sockets2.length > 0) {
          await sockets2[0].join(battleRoom);
        }
      }

      // Send MATCH_FOUND then BATTLE_START to each player
      this.bridge.emitToUser(player1.userId, {
        type: 'MATCH_FOUND',
        battleId,
        opponent: { id: player2.userId, name: user2Name },
      });
      this.logger.log(
        `Sending BATTLE_START to p1 ${player1.userId} — battle ${battleId}, initialState: ${battle.p1State.length} chars`
      );
      this.bridge.emitToUser(player1.userId, {
        type: 'BATTLE_START',
        battleId,
        initialState: battle.p1State,
      });

      this.bridge.emitToUser(player2.userId, {
        type: 'MATCH_FOUND',
        battleId,
        opponent: { id: player1.userId, name: user1Name },
      });
      this.logger.log(
        `Sending BATTLE_START to p2 ${player2.userId} — battle ${battleId}, initialState: ${battle.p2State.length} chars`
      );
      this.bridge.emitToUser(player2.userId, {
        type: 'BATTLE_START',
        battleId,
        initialState: battle.p2State,
      });

      this.logger.log(
        `Battle ${battleId} started: ${user1Name} vs ${user2Name}`
      );
    } catch (error) {
      this.logger.error(`Failed to create battle: ${error}`);
    }
  }

  async declineMatch(userId: string, battleId: string): Promise<void> {
    // Get battle metadata to find the opponent
    const metadata = await this.redis.getBattleMetadata(battleId);
    if (!metadata) {
      this.logger.warn(
        `User ${userId} tried to decline non-existent battle ${battleId}`
      );
      return;
    }

    const config: BattleConfig = JSON.parse(metadata.config);

    // Determine who the opponent is
    const isPlayer1 = config.player1.id === userId;
    const isPlayer2 = config.player2.id === userId;

    if (!isPlayer1 && !isPlayer2) {
      this.logger.warn(
        `User ${userId} tried to decline battle ${battleId} they're not in`
      );
      return;
    }

    const opponentId = isPlayer1 ? config.player2.id : config.player1.id;
    const opponentTeamId = isPlayer1
      ? config.player2.teamId
      : config.player1.teamId;
    const opponentPackedTeam = isPlayer1
      ? config.player2.packedTeam
      : config.player1.packedTeam;

    this.logger.log(
      `User ${userId} declined match ${battleId}, requeuing opponent ${opponentId}`
    );

    // Clean up the battle (it never really started)
    await this.battleManager.cancelBattle(battleId);

    // Notify the opponent and requeue them
    this.logger.log(
      `Sending MATCH_CANCELLED to opponent ${opponentId} — battle ${battleId}`
    );
    this.bridge.emitToUser(opponentId, {
      type: 'MATCH_CANCELLED',
      battleId,
      reason: 'opponent_declined',
    });

    // Requeue the opponent
    await this.matchmaking.joinQueue(
      opponentId,
      config.format,
      opponentTeamId,
      opponentPackedTeam
    );

    // Try to find a new match for the requeued player
    await this.tryFindMatch(config.format);
  }
}

export const MatchOrchestratorServiceProvider: Provider = {
  provide: MATCH_ORCHESTRATOR_SERVICE,
  useClass: MatchOrchestratorService,
};
