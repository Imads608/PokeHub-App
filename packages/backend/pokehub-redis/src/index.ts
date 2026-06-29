// Module
export { PokehubRedisModule } from './lib/backend-pokehub-redis.module';

// Service
export {
  REDIS_SERVICE,
  RedisBattleService,
  redisProvider,
  type RedisConfiguration,
  type RedisService,
} from './lib/redis.service';

// Keys
export { RedisKeys } from './lib/redis.keys';

// Types
export type {
  QueueEntry,
  BattleStatus,
  BattleMetadata,
  RedisBattleMetadata,
  PendingChoices,
  BattleActionMessage,
  BattleUpdateMessage,
  BattleStateUpdateMessage,
  BattleEventUpdateMessage,
  BattleEndUpdateMessage,
  BattleEventPayload,
  OpponentDisconnectedPayload,
  OpponentReconnectedPayload,
  TurnWarningPayload,
  BattleEndData,
} from './lib/redis.types';

export {
  isQueueEntry,
  parseQueueEntry,
  isBattleStatus,
  serializeBattleMetadata,
  parseBattleMetadata,
  isPendingChoices,
  parsePendingChoices,
} from './lib/redis.types';
