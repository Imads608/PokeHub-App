/**
 * Matchmaking Service Interface
 *
 * MVP: Simple FIFO queue matching
 * Phase 2: Rating-based matching with expanding range (Glicko-1)
 * Phase 3: Add region/ping consideration
 *
 * @see docs/plans/rating-matchmaking-system.md for evolution plan
 */

export const MATCHMAKING_SERVICE = 'MATCHMAKING_SERVICE';

export interface QueuedPlayer {
  userId: string;
  teamId: string;
  /**
   * Packed team string in Showdown format.
   * Required for battle creation and deterministic replay.
   */
  packedTeam: string;
  // Phase 2: Rating info (optional for backward compatibility)
  rating?: number;
  rd?: number;
}

/**
 * Options for joining the matchmaking queue
 * Extensible structure for future enhancements
 */
export interface JoinQueueOptions {
  userId: string;
  format: string;
  teamId: string;
  // Phase 3: Client-measured ping data (optional)
  pingByRegion?: Record<string, number>;
  preferredRegion?: string;
}

/**
 * Result returned when successfully joining queue
 */
export interface QueueJoinResult {
  position: number;
  // Phase 2: Additional info (optional)
  estimatedWaitSeconds?: number;
  currentRating?: number;
  searchRange?: number; // Current MMR search range
}

/**
 * Result of a successful match
 */
export interface MatchResult {
  player1: QueuedPlayer;
  player2: QueuedPlayer;
  // Phase 2: Match quality info (optional)
  ratingDiff?: number;
  // Phase 3: Selected server region (optional)
  selectedRegion?: string;
  averagePing?: number;
}

export interface IMatchmakingService {
  /**
   * Add a player to the matchmaking queue
   *
   * MVP: Simple queue position return
   * Phase 2+: Use JoinQueueOptions for extended functionality
   *
   * @param userId - User's ID
   * @param format - Battle format (e.g., 'gen9ou')
   * @param teamId - Team ID reference
   * @param packedTeam - Packed team string for battle creation
   * @returns Queue position (MVP) or QueueJoinResult (Phase 2+)
   */
  joinQueue(
    userId: string,
    format: string,
    teamId: string,
    packedTeam: string
  ): Promise<number>;

  /**
   * Extended join queue with options (Phase 2+)
   * Default implementation can delegate to simple joinQueue
   */
  joinQueueWithOptions?(options: JoinQueueOptions): Promise<QueueJoinResult>;

  /**
   * Remove a player from the matchmaking queue
   */
  leaveQueue(userId: string): Promise<void>;

  /**
   * Check if a player is in the queue
   */
  isInQueue(userId: string): Promise<boolean>;

  /**
   * Get a player's current queue status
   * Phase 2: Returns rating info and search range
   */
  getQueueStatus?(userId: string): Promise<QueueJoinResult | null>;

  /**
   * Try to find a match for a format
   * @returns Matched players or null if not enough players
   *
   * MVP: FIFO matching
   * Phase 2: Rating-based with expanding range
   * Phase 3: Rating + region/ping
   */
  findMatch(format: string): Promise<MatchResult | null>;
}
