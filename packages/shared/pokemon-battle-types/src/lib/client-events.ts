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

/**
 * Sent when client receives MATCH_FOUND but user had already left the queue.
 * This allows the server to cancel the battle and requeue the opponent.
 */
export interface DeclineMatchEvent {
  type: 'DECLINE_MATCH';
  battleId: string;
}

export interface MoveEvent {
  type: 'MOVE';
  battleId: string;
  /** Pokemon Showdown choice string (e.g., 'move 1', 'switch 2') */
  choice: string;
}

export interface CancelChoiceEvent {
  type: 'CANCEL_CHOICE';
  battleId: string;
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
  | DeclineMatchEvent
  | MoveEvent
  | CancelChoiceEvent
  | ForfeitEvent
  | RejoinEvent
  | SaveReplayEvent;

export type ClientBattleEventType = ClientBattleEvent['type'];
