'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Swords, AlertTriangle, WifiOff } from 'lucide-react';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { TURN_TIMEOUT_SECONDS } from '@pokehub/shared/pokemon-battle-types';
import { useBattleSocketContext } from '../context/battle-socket.context';
import { TurnTimer } from './info/turn-timer';

function computeRemaining(totalSeconds: number, startedAt: number): number {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsed);
}

export function ActiveBattleBar() {
  const { state, connected } = useBattleSocketContext();
  const pathname = usePathname();
  const router = useRouter();

  // Only show during battle/ended phases, and not when already on /battle
  const isActive = state.phase === 'battle' || state.phase === 'ended';
  const isOnBattlePage = pathname.startsWith('/battle');

  if (!isActive || isOnBattlePage) return null;

  const { battleId, opponent, opponentDisconnected, winner, endReason } = state;
  const battle = state.battle;
  const hasRequest = !!battle?.request && battle.request.requestType !== 'wait';
  const isYourTurn = hasRequest && !state.pendingChoice;
  const isEnded = state.phase === 'ended';

  // Timer warning state
  const timerWarning =
    state.turnTimer &&
    computeRemaining(state.turnTimer.totalSeconds, state.turnTimer.startedAt) <=
      TURN_TIMEOUT_SECONDS / 2;

  // Determine accent color
  let accentClass = 'border-t-border'; // default muted
  if (!connected) {
    accentClass = 'border-t-yellow-500';
  } else if (isEnded) {
    accentClass = 'border-t-border';
  } else if (opponentDisconnected) {
    accentClass = 'border-t-yellow-500';
  } else if (timerWarning) {
    accentClass = 'border-t-destructive';
  } else if (isYourTurn) {
    accentClass = 'border-t-primary';
  }

  // Status text
  let statusText: string;
  if (isEnded) {
    if (winner) {
      const userId = state.opponent?.id; // if winner !== opponent, we won
      statusText = winner === userId ? 'Defeat' : 'Victory!';
    } else {
      statusText = endReason === 'draw' ? 'Draw' : 'Battle ended';
    }
  } else if (!connected) {
    statusText = 'Reconnecting...';
  } else if (opponentDisconnected) {
    statusText = 'Opponent disconnected';
  } else if (isYourTurn) {
    statusText = 'Your turn!';
  } else {
    statusText = 'Waiting for opponent...';
  }

  const buttonLabel = isEnded ? 'View Results' : 'Return to Battle';

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 border-t-2 ${accentClass} bg-background/80 backdrop-blur-xl ${
        timerWarning && !isEnded ? 'animate-pulse' : ''
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        {/* Left: opponent + status */}
        <div className="flex items-center gap-3 min-w-0">
          {!connected ? (
            <WifiOff className="h-4 w-4 shrink-0 text-yellow-500" />
          ) : opponentDisconnected ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
          ) : (
            <Swords className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          <div className="flex items-center gap-2 min-w-0 text-sm">
            {opponent && (
              <span className="font-semibold truncate">
                vs. {opponent.name}
              </span>
            )}
            {battle && !isEnded && (
              <span className="text-muted-foreground hidden sm:inline">
                Turn {battle.turn}
              </span>
            )}
            <span className="text-muted-foreground hidden xs:inline">—</span>
            <span
              className={`truncate ${
                isYourTurn && !isEnded
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {statusText}
            </span>
          </div>
        </div>

        {/* Right: timer + action */}
        <div className="flex items-center gap-3 shrink-0">
          {state.turnTimer && !isEnded && (
            <TurnTimer
              totalSeconds={state.turnTimer.totalSeconds}
              startedAt={state.turnTimer.startedAt}
            />
          )}
          <Button
            size="sm"
            variant={isYourTurn && !isEnded ? 'default' : 'secondary'}
            className="whitespace-nowrap"
            onClick={() => router.push(`/battle/${battleId}`)}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
