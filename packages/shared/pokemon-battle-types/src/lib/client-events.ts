/**
 * Events sent from client to server via WebSocket
 */

export interface JoinQueueEvent {
  type: 'JOIN_QUEUE';
  /** Full Showdown format ID (e.g., 'gen9ou') */
  format: string;
  teamId: string;
}

export interface LeaveQueueEvent {
  type: 'LEAVE_QUEUE';
}

export interface MoveEvent {
  type: 'MOVE';
  battleId: string;
  /** Pokemon Showdown choice string (e.g., 'move 1', 'switch 2') */
  choice: string;
}

export interface ForfeitEvent {
  type: 'FORFEIT';
  battleId: string;
}

export interface RejoinEvent {
  type: 'REJOIN';
  battleId: string;
}

export interface SaveReplayEvent {
  type: 'SAVE_REPLAY';
  battleId: string;
}

export type ClientBattleEvent =
  | JoinQueueEvent
  | LeaveQueueEvent
  | MoveEvent
  | ForfeitEvent
  | RejoinEvent
  | SaveReplayEvent;

export type ClientBattleEventType = ClientBattleEvent['type'];
