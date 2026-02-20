import {
  TURN_TIMER_SERVICE,
  type ITurnTimerService,
  type TurnTimeoutCallback,
  type TurnWarningCallback,
} from './turn-timer.service.interface';
import type { Provider } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { TURN_TIMEOUT_SECONDS } from '@pokehub/shared/pokemon-battle-types';

const TURN_TIMEOUT_MS = TURN_TIMEOUT_SECONDS * 1000;

interface PlayerTimers {
  warningTimer: ReturnType<typeof setTimeout> | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
  playerId: string;
}

interface BattleTimers {
  p1: PlayerTimers;
  p2: PlayerTimers;
}

/**
 * Turn Timer Service
 *
 * Manages turn timers for all active battles.
 * - Warning callback at the halfway point of the turn
 * - Timeout callback at TURN_TIMEOUT_SECONDS for auto-move
 */
@Injectable()
class TurnTimerService implements ITurnTimerService {
  private readonly timers = new Map<string, BattleTimers>();
  private onWarning: TurnWarningCallback | null = null;
  private onTimeout: TurnTimeoutCallback | null = null;

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(TurnTimerService.name);
  }

  setCallbacks(
    onWarning: TurnWarningCallback,
    onTimeout: TurnTimeoutCallback
  ): void {
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;
  }

  startTimers(
    battleId: string,
    p1Id: string,
    p2Id: string,
    p1HasChosen: boolean,
    p2HasChosen: boolean
  ): void {
    // Initialize battle timers if not exists
    if (!this.timers.has(battleId)) {
      this.timers.set(battleId, {
        p1: { warningTimer: null, timeoutTimer: null, playerId: p1Id },
        p2: { warningTimer: null, timeoutTimer: null, playerId: p2Id },
      });
    }

    const battleTimers = this.timers.get(battleId)!;

    // Start timer for p1 if they haven't chosen
    if (!p1HasChosen) {
      this.startPlayerTimer(battleId, battleTimers.p1, 'p1');
    }

    // Start timer for p2 if they haven't chosen
    if (!p2HasChosen) {
      this.startPlayerTimer(battleId, battleTimers.p2, 'p2');
    }
  }

  cancelPlayerTimer(battleId: string, player: 'p1' | 'p2'): void {
    const battleTimers = this.timers.get(battleId);
    if (!battleTimers) return;

    const playerTimers = battleTimers[player];
    this.clearPlayerTimers(playerTimers);

    this.logger.debug(`Battle ${battleId}: ${player} timer cancelled`);
  }

  cancelBattleTimers(battleId: string): void {
    const battleTimers = this.timers.get(battleId);
    if (!battleTimers) return;

    this.clearPlayerTimers(battleTimers.p1);
    this.clearPlayerTimers(battleTimers.p2);
    this.timers.delete(battleId);

    this.logger.debug(`Battle ${battleId}: all timers cancelled`);
  }

  hasActiveTimer(battleId: string, player: 'p1' | 'p2'): boolean {
    const battleTimers = this.timers.get(battleId);
    if (!battleTimers) return false;

    const playerTimers = battleTimers[player];
    return (
      playerTimers.warningTimer !== null || playerTimers.timeoutTimer !== null
    );
  }

  // ==================== Private Helpers ====================

  private startPlayerTimer(
    battleId: string,
    playerTimers: PlayerTimers,
    player: 'p1' | 'p2'
  ): void {
    // Clear any existing timers first
    this.clearPlayerTimers(playerTimers);

    const playerId = playerTimers.playerId;

    const warningMs = TURN_TIMEOUT_MS / 2;
    const warningSecondsRemaining = TURN_TIMEOUT_SECONDS / 2;

    // Warning timer — fires at the halfway point of the turn
    playerTimers.warningTimer = setTimeout(() => {
      this.logger.debug(
        `Battle ${battleId}: ${player} turn warning (${warningSecondsRemaining}s remaining)`
      );

      if (this.onWarning) {
        void this.onWarning(battleId, player, warningSecondsRemaining);
      }
    }, warningMs);

    // Timeout timer — fires at TURN_TIMEOUT_SECONDS
    playerTimers.timeoutTimer = setTimeout(() => {
      this.logger.log(
        `Battle ${battleId}: ${player} turn timeout (${TURN_TIMEOUT_SECONDS}s)`
      );

      // Clear the warning timer reference
      playerTimers.warningTimer = null;
      playerTimers.timeoutTimer = null;

      if (this.onTimeout) {
        void this.onTimeout(battleId, player, playerId);
      }
    }, TURN_TIMEOUT_MS);

    this.logger.debug(`Battle ${battleId}: ${player} timer started`);
  }

  private clearPlayerTimers(playerTimers: PlayerTimers): void {
    if (playerTimers.warningTimer) {
      clearTimeout(playerTimers.warningTimer);
      playerTimers.warningTimer = null;
    }
    if (playerTimers.timeoutTimer) {
      clearTimeout(playerTimers.timeoutTimer);
      playerTimers.timeoutTimer = null;
    }
  }
}

export const TurnTimerServiceProvider: Provider = {
  provide: TURN_TIMER_SERVICE,
  useClass: TurnTimerService,
};
