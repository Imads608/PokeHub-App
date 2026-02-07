import type { Provider } from '@nestjs/common';

export const TURN_TIMER_SERVICE = 'TURN_TIMER_SERVICE';

/**
 * Callback invoked when a player's turn times out
 */
export type TurnTimeoutCallback = (
  battleId: string,
  player: 'p1' | 'p2',
  playerId: string
) => Promise<void>;

/**
 * Callback invoked when a player should receive a turn warning
 */
export type TurnWarningCallback = (
  battleId: string,
  player: 'p1' | 'p2',
  secondsRemaining: number
) => Promise<void>;

/**
 * Turn Timer Service Interface
 *
 * Manages turn timers for battles. Sends warnings at 30s and
 * triggers auto-move at 60s.
 */
export interface ITurnTimerService {
  /**
   * Register callbacks for timer events
   */
  setCallbacks(
    onWarning: TurnWarningCallback,
    onTimeout: TurnTimeoutCallback
  ): void;

  /**
   * Start turn timers for a battle.
   * Call after battle creation and after each turn executes.
   *
   * @param battleId - The battle ID
   * @param p1Id - Player 1's user ID
   * @param p2Id - Player 2's user ID
   * @param p1HasChosen - Whether p1 has already submitted their choice
   * @param p2HasChosen - Whether p2 has already submitted their choice
   */
  startTimers(
    battleId: string,
    p1Id: string,
    p2Id: string,
    p1HasChosen: boolean,
    p2HasChosen: boolean
  ): void;

  /**
   * Cancel a specific player's timer (when they submit a choice)
   */
  cancelPlayerTimer(battleId: string, player: 'p1' | 'p2'): void;

  /**
   * Cancel all timers for a battle (when battle ends)
   */
  cancelBattleTimers(battleId: string): void;

  /**
   * Check if a player has an active timer
   */
  hasActiveTimer(battleId: string, player: 'p1' | 'p2'): boolean;
}

export function createTurnTimerServiceProvider(
  useClass: new (...args: unknown[]) => ITurnTimerService
): Provider {
  return {
    provide: TURN_TIMER_SERVICE,
    useClass,
  };
}
