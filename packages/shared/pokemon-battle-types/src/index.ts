export {
  type BattlePlayer,
  type BattleConfig,
  generateBattleSeed,
} from './lib/battle-config';
export {
  type JoinQueueEvent,
  type LeaveQueueEvent,
  type MoveEvent,
  type ForfeitEvent,
  type RejoinEvent,
  type SaveReplayEvent,
  type ClientBattleEvent,
  type ClientBattleEventType,
} from './lib/client-events';
export {
  type QueueJoinedEvent,
  type QueueLeftEvent,
  type MatchFoundEvent,
  type BattleStartEvent,
  type BattleUpdateEvent,
  type BattleEndReason,
  type BattleEndEvent,
  type ReplaySavedEvent,
  type TurnWarningEvent,
  type OpponentDisconnectedEvent,
  type OpponentReconnectedEvent,
  type BattleRestoredEvent,
  type BattleErrorEvent,
  type ServerBattleEvent,
  type ServerBattleEventType,
} from './lib/server-events';
export { type BattleErrorCode, isRecoverableError } from './lib/errors';
export { JoinQueueDTOSchema, type JoinQueueDTO } from './lib/dto/join-queue.dto';
export {
  BattleMoveDTOSchema,
  type BattleMoveDTO,
  ForfeitDTOSchema,
  type ForfeitDTO,
  SaveReplayDTOSchema,
  type SaveReplayDTO,
} from './lib/dto/battle-move.dto';
export {
  BATTLE_NAMESPACE,
  BattleRooms,
  BATTLE_EVENT,
} from './lib/socket.constants';
