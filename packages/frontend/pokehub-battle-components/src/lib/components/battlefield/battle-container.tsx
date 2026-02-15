'use client';

import { useBattleSocketContext } from '../../context/battle-socket.context';
import { ActionPanel } from '../actions/action-panel';
import { BattleEndOverlay } from '../end/battle-end-overlay';
import { BattleHeader } from '../info/battle-header';
import { BattleLog } from '../info/battle-log';
import { FieldEffects } from './field-effects';
import { PokemonSide } from './pokemon-side';

export function BattleContainer() {
  const { state, submitMove, cancelChoice, forfeit, saveReplay } =
    useBattleSocketContext();
  const { battle, battleId } = state;

  if (!battle || !battleId) return null;

  // Determine which side we are from the request
  const mySideId = battle.request?.side?.id ?? 'p1';
  const opponentSideId = mySideId === 'p1' ? 'p2' : 'p1';

  const mySide = battle[mySideId];
  const opponentSide = battle[opponentSideId];

  const myActive = mySide?.active[0] ?? null;
  const opponentActive = opponentSide?.active[0] ?? null;

  const myName = mySide?.name || null;

  const handleMoveSelect = (choice: string) => {
    submitMove(battleId, choice);
  };

  const handleSwitchSelect = (choice: string) => {
    submitMove(battleId, choice);
  };

  const handleTeamSelect = (choice: string) => {
    submitMove(battleId, choice);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-4">
      <BattleHeader
        format={String(battle.tier || '')}
        turn={battle.turn}
        timer={state.turnTimer}
        onForfeit={() => forfeit(battleId)}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main battlefield */}
        <div className="relative space-y-4">
          {/* Opponent side */}
          <div className="flex justify-start">
            <PokemonSide pokemon={opponentActive} isOpponent />
          </div>

          {/* Field effects */}
          <FieldEffects field={battle.field} />

          {/* Player side */}
          <div className="flex justify-end">
            <PokemonSide pokemon={myActive} isOpponent={false} />
          </div>

          {/* Opponent disconnect overlay */}
          {state.opponentDisconnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <p className="font-semibold">Opponent disconnected</p>
                {state.disconnectTimeout && (
                  <p className="text-sm text-muted-foreground">
                    Waiting {state.disconnectTimeout}s...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Battle end overlay */}
          {state.phase === 'ended' && (
            <BattleEndOverlay
              winner={state.winner}
              myName={myName}
              endReason={state.endReason}
              canSaveReplay={state.canSaveReplay}
              replaySaved={state.replaySaved}
              onSaveReplay={() => saveReplay(battleId)}
            />
          )}
        </div>

        {/* Right column: log */}
        <BattleLog entries={state.logEntries} />
      </div>

      {/* Action panel */}
      {state.phase === 'battle' && (
        <div className="mt-4">
          <ActionPanel
            battle={battle}
            pendingChoice={state.pendingChoice}
            onMoveSelect={handleMoveSelect}
            onSwitchSelect={handleSwitchSelect}
            onTeamSelect={handleTeamSelect}
            onCancelChoice={cancelChoice}
          />
        </div>
      )}
    </div>
  );
}
