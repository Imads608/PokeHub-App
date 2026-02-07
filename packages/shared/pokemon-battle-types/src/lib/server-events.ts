/**
 * Events sent from server to client via WebSocket
 */

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
  /** Optional message about recovery */
  message?: string;
}

export interface BattleErrorEvent {
  type: 'ERROR';
  code: string;
  message: string;
  /** Whether the client can recover from this error */
  recoverable: boolean;
}

export type ServerBattleEvent =
  | QueueJoinedEvent
  | QueueLeftEvent
  | MatchFoundEvent
  | BattleStartEvent
  | BattleUpdateEvent
  | BattleEndEvent
  | ReplaySavedEvent
  | TurnWarningEvent
  | OpponentDisconnectedEvent
  | OpponentReconnectedEvent
  | BattleRestoredEvent
  | BattleErrorEvent;

export type ServerBattleEventType = ServerBattleEvent['type'];
