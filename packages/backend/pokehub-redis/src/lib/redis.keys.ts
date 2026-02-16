/**
 * Redis key builders for the battle system.
 * All keys are namespaced and typed for consistency.
 */
export const RedisKeys = {
  // Battle keys
  battle: {
    metadata: (battleId: string) => `battle:${battleId}` as const,
    seed: (battleId: string) => `battle:${battleId}:seed` as const,
    log: (battleId: string) => `battle:${battleId}:log` as const,
  },

  // User keys
  user: {
    currentBattle: (userId: string) => `user:${userId}:battle` as const,
    queueStatus: (userId: string) => `user:${userId}:queue` as const,
  },

  // Matchmaking keys
  matchmaking: {
    queue: (format: string) => `queue:${format}` as const,
  },

  // Server keys (for horizontal scaling)
  server: {
    heartbeat: (serverId: string) => `server:${serverId}:heartbeat` as const,
    battles: (serverId: string) => `server:${serverId}:battles` as const,
  },

  // Pub/Sub channels
  channels: {
    /** Per-user channel for delivering battle events when the user is on another server */
    userBattleEvent: (userId: string) => `user:${userId}:battle-events` as const,
    battleMove: (battleId: string) => `battle:${battleId}:move` as const,
    battleUpdate: (battleId: string) => `battle:${battleId}:update` as const,

    // Prefixes for parsing incoming channel names
    prefixes: {
      userBattleEvent: 'user:' as const,
      userBattleEventSuffix: ':battle-events' as const,
      battleUpdate: ':update' as const,
    },

    // Parse userId from user:{userId}:battle-events channel
    parseUserBattleEventUserId: (channel: string): string | null => {
      if (
        channel.startsWith('user:') &&
        channel.endsWith(':battle-events')
      ) {
        return channel.slice('user:'.length, -':battle-events'.length);
      }
      return null;
    },

    // Parse battleId from battle:{battleId}:update channel
    parseBattleUpdateId: (channel: string): string | null => {
      if (channel.endsWith(':update') && channel.startsWith('battle:')) {
        return channel.slice('battle:'.length, -':update'.length);
      }
      return null;
    },
  },
} as const;
