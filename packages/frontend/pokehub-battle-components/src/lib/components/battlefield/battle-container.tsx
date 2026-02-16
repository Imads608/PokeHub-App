'use client';

import { useBattleSocketContext } from '../../context/battle-socket.context';
import { ActionPanel } from '../actions/action-panel';
import { BattleEndOverlay } from '../end/battle-end-overlay';
import { BattleHeader } from '../info/battle-header';
import { BattleLog } from '../info/battle-log';
import { FieldEffects } from './field-effects';
import { PokemonSide } from './pokemon-side';

export function BattleContainer() {
  const { state, userId, submitMove, cancelChoice, forfeit, saveReplay } =
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Main battlefield */}
        <div className="relative">
          {/* Arena area with subtle background */}
          <div className="relative rounded-2xl border border-border/30 bg-gradient-to-b from-muted/20 via-transparent to-muted/20 p-6 min-h-[340px] flex flex-col justify-between">
            {/* Opponent side — top right */}
            <div className="flex justify-end">
              <PokemonSide pokemon={opponentActive} isOpponent />
            </div>

            {/* Field effects — centered */}
            <div className="py-2">
              <FieldEffects field={battle.field} />
            </div>

            {/* Player side — bottom left */}
            <div className="flex justify-start">
              <PokemonSide pokemon={myActive} isOpponent={false} />
            </div>

            {/* Opponent disconnect overlay */}
            {state.opponentDisconnected && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-md rounded-2xl">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-2 ring-1 ring-yellow-500/20">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-sm font-semibold text-yellow-500">
                      Opponent disconnected
                    </span>
                  </div>
                  {state.disconnectTimeout && (
                    <p className="text-sm text-muted-foreground">
                      Waiting <span className="font-mono tabular-nums font-semibold">{state.disconnectTimeout}s</span>...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Battle end overlay */}
            {state.phase === 'ended' && (
              <BattleEndOverlay
                winner={state.winner}
                myUserId={userId}
                endReason={state.endReason}
                canSaveReplay={state.canSaveReplay}
                replaySaved={state.replaySaved}
                onSaveReplay={() => saveReplay(battleId)}
              />
            )}
          </div>
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
