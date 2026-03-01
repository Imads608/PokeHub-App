/**
 * Events sent from server to client via WebSocket
 */

import type { MoveAnimConfig } from './move-anim-config';

export interface QueueJoinedEvent {
  type: 'QUEUE_JOINED';
  position: number;
}

export interface QueueLeftEvent {
  type: 'QUEUE_LEFT';
}

export interface MatchFoundEvent {
  type: 'MATCH_FOUND';
  battleId: string;
  opponent: {
    id: string;
    name: string;
  };
}

export interface BattleStartEvent {
  type: 'BATTLE_START';
  battleId: string;
  /** Initial battle state from @pkmn/sim */
  initialState: string;
  /** Animation configs for moves in this battle (keyed by normalized move name) */
  moveAnimConfigs: Record<string, MoveAnimConfig>;
}

export interface BattleUpdateEvent {
  type: 'BATTLE_UPDATE';
  battleId: string;
  /** Battle protocol data from @pkmn/sim */
  data: string;
  /** True if this update was triggered by auto-move due to timer */
  autoMove?: boolean;
}

export type BattleEndReason =
  | 'win'
  | 'forfeit'
  | 'opponent_forfeit'
  | 'opponent_timeout'
  | 'draw';

export interface BattleEndEvent {
  type: 'BATTLE_END';
  battleId: string;
  /** Winner's user ID, or null for draw */
  winner: string | null;
  reason: BattleEndReason;
  /** Whether the replay can still be saved (within 5 min window) */
  canSaveReplay: boolean;
}

export interface ReplaySavedEvent {
  type: 'REPLAY_SAVED';
  battleId: string;
  /** User's current replay count after saving */
  replayCount: number;
}

export interface TurnWarningEvent {
  type: 'TURN_WARNING';
  battleId: string;
  secondsRemaining: number;
}

export interface OpponentDisconnectedEvent {
  type: 'OPPONENT_DISCONNECTED';
  battleId: string;
  /** Seconds until auto-forfeit */
  timeout: number;
}

export interface OpponentReconnectedEvent {
  type: 'OPPONENT_RECONNECTED';
  battleId: string;
}

export interface BattleRestoredEvent {
  type: 'BATTLE_RESTORED';
  battleId: string;
  /** Current battle state for reconnection */
  currentState: string;
  /** Animation configs for moves in this battle (keyed by normalized move name) */
  moveAnimConfigs: Record<string, MoveAnimConfig>;
  /** Optional message about recovery */
  message?: string;
}

/**
 * Sent when a match is cancelled because the opponent declined.
 * The player will be automatically requeued.
 */
export interface MatchCancelledEvent {
  type: 'MATCH_CANCELLED';
  battleId: string;
  reason: 'opponent_declined';
}

export interface BattleErrorEvent {
  type: 'ERROR';
  code: string;
  message: string;
  /** Whether the client can recover from this error */
  recoverable: boolean;
}

/**
 * Sent when the server's ability to process battle operations changes.
 * Battles cannot proceed when status is 'unavailable' — the frontend should block actions.
 */
export interface ServerStatusEvent {
  type: 'SERVER_STATUS';
  status: 'unavailable' | 'restored';
}

export interface QueueCountsEvent {
  type: 'QUEUE_COUNTS';
  counts: Record<string, number>;
}

export type ServerBattleEvent =
  | QueueJoinedEvent
  | QueueLeftEvent
  | MatchFoundEvent
  | MatchCancelledEvent
  | BattleStartEvent
  | BattleUpdateEvent
  | BattleEndEvent
  | ReplaySavedEvent
  | TurnWarningEvent
  | OpponentDisconnectedEvent
  | OpponentReconnectedEvent
  | BattleRestoredEvent
  | BattleErrorEvent
  | ServerStatusEvent
  | QueueCountsEvent;

export type ServerBattleEventType = ServerBattleEvent['type'];
