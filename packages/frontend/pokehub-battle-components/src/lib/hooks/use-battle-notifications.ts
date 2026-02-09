'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import type { BattleUIState } from '../types/battle-ui.types';

/**
 * Shows toast notifications for battle events when the user is NOT on the
 * `/battle` page. Called inside BattleSocketProvider so it works on every page.
 *
 * Relies on the @pkmn/client Battle instance for structured state (turn number,
 * request availability, player side) rather than manually parsing protocol text.
 */
export function useBattleNotifications(
  state: BattleUIState,
  lastEvent: ServerBattleEvent | null
): void {
  const pathname = usePathname();
  const router = useRouter();
  const lastNotifiedTurnRef = useRef<number>(0);

  const isOnBattlePage = pathname?.startsWith('/battle') ?? false;
  const battleId = state.battleId;

  useEffect(() => {
    if (!lastEvent || isOnBattlePage || !battleId) return;

    const goToBattle = () => router.push(`/battle/${battleId}`);

    switch (lastEvent.type) {
      case 'BATTLE_UPDATE': {
        // The Battle instance tracks the current turn and whether we have
        // a pending request (meaning it's our turn to act).
        const battle = state.battle;
        const turn = battle?.turn ?? 0;
        if (battle?.request && turn > lastNotifiedTurnRef.current) {
          lastNotifiedTurnRef.current = turn;
          toast("It's your turn!", {
            description: 'Make your move before the timer runs out.',
            action: { label: 'Go to battle', onClick: goToBattle },
          });
        }
        break;
      }

      case 'TURN_WARNING':
        toast.warning(
          `Turn timer: ${lastEvent.secondsRemaining}s remaining!`,
          { action: { label: 'Go to battle', onClick: goToBattle } }
        );
        break;

      case 'OPPONENT_DISCONNECTED':
        toast.info('Your opponent disconnected.', {
          description: `Auto-forfeit in ${lastEvent.timeout}s if they don't return.`,
          action: { label: 'Go to battle', onClick: goToBattle },
        });
        break;

      case 'OPPONENT_RECONNECTED':
        toast.info('Your opponent reconnected.');
        break;

      case 'BATTLE_END': {
        // Determine if we won using the Battle instance's knowledge of
        // which side we are (from battle.request.side parsed by @pkmn/client).
        const mySide = state.battle?.request?.side?.id;
        const winnerName = lastEvent.winner;

        if (winnerName === null) {
          toast.info('Battle ended in a draw.', {
            action: { label: 'View results', onClick: goToBattle },
          });
        } else if (mySide && state.battle?.[mySide]?.name === winnerName) {
          toast.success('Victory! You won the battle.', {
            action: { label: 'View results', onClick: goToBattle },
          });
        } else {
          toast.info('Battle ended.', {
            action: { label: 'View results', onClick: goToBattle },
          });
        }

        lastNotifiedTurnRef.current = 0;
        break;
      }

      case 'BATTLE_RESTORED':
        toast.info('You have an active battle.', {
          action: { label: 'Rejoin battle', onClick: goToBattle },
        });
        break;
    }
  }, [lastEvent, isOnBattlePage, battleId, state.battle, router]);
}
