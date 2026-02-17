/**
 * Data types for Redis storage.
 * These define the shape of data stored at each key.
 */

/**
 * Entry in the matchmaking queue (stored as JSON in a Redis list)
 *
 * MVP: Uses userId, teamId, packedTeam, joinedAt
 * Phase 2: Adds rating, rd for Glicko-based matchmaking
 * Phase 3: Adds region, pingByRegion for latency-aware matching
 *
 * @see docs/plans/rating-matchmaking-system.md for evolution plan
 */
export interface QueueEntry {
  userId: string;
  teamId: string;
  /**
   * Packed team string in Showdown format.
   * Required for battle creation and deterministic replay.
   */
  packedTeam: string;
  joinedAt: number; // Unix timestamp

  // Phase 2: Glicko rating (optional for backward compatibility)
  // Server fetches from DB when joining queue - not sent by client
  rating?: number;
  rd?: number; // Rating deviation (uncertainty)

  // Phase 3: Region/latency (optional for backward compatibility)
  region?: string; // Preferred region: 'na', 'eu', 'asia', etc.
  pingByRegion?: Record<string, number>; // Measured ping to each region
}

export function isQueueEntry(value: unknown): value is QueueEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  // Required fields
  const hasRequired =
    typeof obj['userId'] === 'string' &&
    typeof obj['teamId'] === 'string' &&
    typeof obj['packedTeam'] === 'string' &&
    typeof obj['joinedAt'] === 'number';

  if (!hasRequired) return false;

  // Optional Phase 2 fields
  if ('rating' in obj && typeof obj['rating'] !== 'number') return false;
  if ('rd' in obj && typeof obj['rd'] !== 'number') return false;

  // Optional Phase 3 fields
  if ('region' in obj && typeof obj['region'] !== 'string') return false;
  if ('pingByRegion' in obj && typeof obj['pingByRegion'] !== 'object')
    return false;

  return true;
}

export function parseQueueEntry(json: string): QueueEntry {
  const parsed: unknown = JSON.parse(json);
  if (!isQueueEntry(parsed)) {
    throw new Error('Invalid QueueEntry JSON');
  }
  return parsed;
}

/**
 * Battle status options
 */
export type BattleStatus = 'active' | 'completed' | 'forfeited';

export function isBattleStatus(value: string): value is BattleStatus {
  switch (value) {
    case 'active':
    case 'completed':
    case 'forfeited':
      return true;
    default:
      return false;
  }
}

/**
 * Battle metadata stored as a Redis hash.
 * All values are strings since Redis hashes store string values.
 */
export interface BattleMetadata {
  /** JSON string of BattleConfig */
  config: string;
  /** Current battle status */
  status: BattleStatus;
  /** Server ID hosting this battle (hostname) */
  hostServer: string;
  /** JSON string of pending move choices { p1?: string, p2?: string } */
  pending: string;
  /** Whether player 1 is disconnected ('true' | 'false') */
  p1Disconnected: string;
  /** Whether player 2 is disconnected ('true' | 'false') */
  p2Disconnected: string;
  /** Timestamp when p1 disconnected (if applicable) */
  p1DisconnectTime?: string;
  /** Timestamp when p2 disconnected (if applicable) */
  p2DisconnectTime?: string;
  /** Winner user ID when battle ends (empty string for draw) */
  winnerId?: string;
}

/**
 * Raw Redis hash data (all string values)
 */
export type RedisBattleMetadata = Record<string, string>;

export function serializeBattleMetadata(
  metadata: BattleMetadata
): RedisBattleMetadata {
  const result: RedisBattleMetadata = {
    config: metadata.config,
    status: metadata.status,
    hostServer: metadata.hostServer,
    pending: metadata.pending,
    p1Disconnected: metadata.p1Disconnected,
    p2Disconnected: metadata.p2Disconnected,
  };
  if (metadata.p1DisconnectTime !== undefined) {
    result['p1DisconnectTime'] = metadata.p1DisconnectTime;
  }
  if (metadata.p2DisconnectTime !== undefined) {
    result['p2DisconnectTime'] = metadata.p2DisconnectTime;
  }
  return result;
}

export function parseBattleMetadata(
  data: RedisBattleMetadata
): BattleMetadata | null {
  const {
    config,
    status,
    hostServer,
    pending,
    p1Disconnected,
    p2Disconnected,
  } = data;

  if (
    !config ||
    !status ||
    !hostServer ||
    !pending ||
    !p1Disconnected ||
    !p2Disconnected
  ) {
    return null;
  }

  if (!isBattleStatus(status)) {
    return null;
  }

  return {
    config,
    status,
    hostServer,
    pending,
    p1Disconnected,
    p2Disconnected,
    p1DisconnectTime: data['p1DisconnectTime'],
    p2DisconnectTime: data['p2DisconnectTime'],
    winnerId: data['winnerId'],
  };
}

/**
 * Pending move choices for a battle turn
 */
export interface PendingChoices {
  p1?: string;
  p2?: string;
}

export function isPendingChoices(value: unknown): value is PendingChoices {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if ('p1' in obj && typeof obj['p1'] !== 'string') return false;
  if ('p2' in obj && typeof obj['p2'] !== 'string') return false;
  return true;
}

export function parsePendingChoices(json: string): PendingChoices {
  const parsed: unknown = JSON.parse(json);
  if (!isPendingChoices(parsed)) {
    throw new Error('Invalid PendingChoices JSON');
  }
  return parsed;
}

/**
 * Pub/Sub message for battle move (cross-server)
 */
export interface BattleMoveMessage {
  player: 'p1' | 'p2';
  choice: string;
}

/**
 * Battle update event payloads (structured events, not raw battle state)
 */
export interface OpponentDisconnectedPayload {
  event: 'opponent_disconnected';
  player: 'p1' | 'p2';
}

export interface OpponentReconnectedPayload {
  event: 'opponent_reconnected';
  player: 'p1' | 'p2';
}

export interface TurnWarningPayload {
  event: 'turn_warning';
  player: 'p1' | 'p2';
  secondsRemaining: number;
}

export type BattleEventPayload =
  | OpponentDisconnectedPayload
  | OpponentReconnectedPayload
  | TurnWarningPayload;

/**
 * Pub/Sub message for battle state update (raw @pkmn/sim output).
 * Contains per-player perspective data so each player only sees
 * information they should have access to (opponent info redacted).
 * Player IDs are included for cross-server routing.
 */
export interface BattleStateUpdateMessage {
  type: 'state';
  p1Id: string;
  p2Id: string;
  p1Data: string;
  p2Data: string;
}

/**
 * Pub/Sub message for battle events (structured).
 * targetUserId is the user who should receive this event.
 */
export interface BattleEventUpdateMessage {
  type: 'event';
  targetUserId: string;
  data: BattleEventPayload;
}

/**
 * Pub/Sub message for battle end
 */
export interface BattleEndUpdateMessage {
  type: 'end';
  data: BattleEndData;
}

/**
 * Pub/Sub message for battle update (cross-server)
 */
export type BattleUpdateMessage =
  | BattleStateUpdateMessage
  | BattleEventUpdateMessage
  | BattleEndUpdateMessage;

/**
 * Data structure for battle end messages (parsed from BattleUpdateMessage.data when type='end')
 */
export interface BattleEndData {
  winnerId: string | null;
  reason: 'win' | 'forfeit' | 'opponent_forfeit' | 'opponent_timeout' | 'draw';
}
