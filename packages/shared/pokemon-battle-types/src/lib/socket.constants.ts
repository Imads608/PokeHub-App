/**
 * Socket.io constants shared between client and server.
 */

/** WebSocket namespace for battle connections */
export const BATTLE_NAMESPACE = '/battle';

/** Socket.io room name builders */
export const BattleRooms = {
  battle: (battleId: string) => `battle:${battleId}` as const,
} as const;

/** Socket.io event name used for all battle events */
export const BATTLE_EVENT = 'event' as const;

/** Turn timer durations (shared between server enforcement and client display) */
export const TURN_WARNING_SECONDS = 30;
export const TURN_TIMEOUT_SECONDS = 120;
