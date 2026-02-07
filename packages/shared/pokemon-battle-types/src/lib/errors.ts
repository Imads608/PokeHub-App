/**
 * Error codes for battle system
 */
export type BattleErrorCode =
  // Connection errors
  | 'CONNECTION_FAILED'
  | 'AUTH_FAILED'
  // Queue errors
  | 'ALREADY_IN_QUEUE'
  | 'ALREADY_IN_BATTLE'
  | 'INVALID_FORMAT'
  | 'INVALID_TEAM'
  | 'REDIS_UNAVAILABLE'
  // Battle errors
  | 'BATTLE_NOT_FOUND'
  | 'BATTLE_ENDED'
  | 'INVALID_MOVE'
  | 'NOT_YOUR_TURN'
  | 'NOT_IN_BATTLE'
  // Replay errors
  | 'MAX_REPLAYS_REACHED'
  | 'REPLAY_WINDOW_EXPIRED'
  | 'REPLAY_ALREADY_SAVED';

/**
 * Check if an error code indicates the client can recover
 */
export function isRecoverableError(code: BattleErrorCode): boolean {
  switch (code) {
    case 'ALREADY_IN_QUEUE':
    case 'ALREADY_IN_BATTLE':
    case 'INVALID_MOVE':
    case 'NOT_YOUR_TURN':
    case 'MAX_REPLAYS_REACHED':
    case 'REPLAY_WINDOW_EXPIRED':
    case 'REPLAY_ALREADY_SAVED':
      return true;
    default:
      return false;
  }
}
