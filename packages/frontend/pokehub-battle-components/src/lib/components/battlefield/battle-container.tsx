'use client';

import { useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { useBattleSocketContext } from '../../context/battle-socket.context';
import {
  AnimationProvider,
  useAnimationContext,
} from '../../context/animation.context';
import { playAnimationEvent } from '../../animations/state-anims';
import { ActionPanel } from '../actions/action-panel';
import { BattleEndOverlay } from '../end/battle-end-overlay';
import { BattleHeader } from '../info/battle-header';
import { BattleLog } from '../info/battle-log';
import { BattlefieldBg } from './battlefield-bg';
import { PopupLayer } from './damage-popup';
import { EffectLayer } from './effect-sprite';
import { WeatherBar, SideConditions } from './field-effects';
import { PokemonSide } from './pokemon-side';
import { TeamPanel } from './team-panel';

export function BattleContainer() {
  return (
    <AnimationProvider>
      <BattleContainerInner />
    </AnimationProvider>
  );
}

function BattleContainerInner() {
  const { state, userId, submitMove, cancelChoice, forfeit, saveReplay, processPendingEvents, pendingVersion } =
    useBattleSocketContext();
  const { battle, battleId } = state;
  const {
    arenaRef,
    registerSprite,
    unregisterSprite,
    effects,
    popups,
    flashColor,
    shakeOffset,
    scene,
    isMounted,
  } = useAnimationContext();

  // Stable animation function bound to the current scene
  const playAnimation = useCallback(
    (event: Parameters<typeof playAnimationEvent>[1]) => playAnimationEvent(scene, event),
    [scene]
  );

  // Process pending protocol events when new ones arrive
  useEffect(() => {
    if (!battle || state.phase !== 'battle') return;

    // When visible, play animations inline. When off-screen, skip animations
    // but still process all protocol events (state stays current).
    void processPendingEvents(isMounted ? playAnimation : undefined);
  }, [pendingVersion]);

  if (!battle || !battleId) return null;

  // Determine which side we are from the request (singles: always p1 or p2)
  const mySideId = (battle.request?.side?.id ?? 'p1') as 'p1' | 'p2';
  const opponentSideId: 'p1' | 'p2' = mySideId === 'p1' ? 'p2' : 'p1';

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
    <div className="container mx-auto max-w-7xl px-4 py-4">
      <BattleHeader
        format={String(battle.tier || '')}
        turn={battle.turn}
        timer={state.turnTimer}
        onForfeit={() => forfeit(battleId)}
      />

      {/* Main layout: Team Panels | Battlefield | Log */}
      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_280px]">
        {/* Left column: Player's team roster */}
        <div className="hidden lg:block rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-2 self-start">
          <TeamPanel
            battle={battle}
            sideId={mySideId}
            isPlayer
          />
        </div>

        {/* Center column: Battlefield + Actions */}
        <div className="space-y-3">
          {/* Arena — wrapped in motion.div for screen shake */}
          <motion.div
            ref={arenaRef as React.RefObject<HTMLDivElement>}
            animate={{
              x: shakeOffset.x,
              y: shakeOffset.y,
            }}
            transition={{ duration: 0.05, ease: 'linear' }}
            className="relative rounded-2xl border border-border/30 overflow-hidden p-8 min-h-[400px] flex flex-col justify-between"
          >
            {/* Battlefield background */}
            <BattlefieldBg
              weather={battle.field.weather}
              terrain={battle.field.terrain}
            />

            {/* Weather / Terrain / Pseudo-weather — top edge bar */}
            <WeatherBar field={battle.field} />

            {/* Effect sprites layer */}
            <EffectLayer effects={effects} />

            {/* Damage/text popup layer */}
            <PopupLayer popups={popups} />

            {/* Flash overlay */}
            {flashColor && (
              <div
                className="pointer-events-none absolute inset-0 z-50 transition-opacity duration-100"
                style={{ backgroundColor: flashColor }}
              />
            )}

            {/* Opponent side — top right */}
            <div className="relative z-10 flex flex-col items-end gap-1.5">
              <PokemonSide
                pokemon={opponentActive}
                gen={battle.gen}
                isOpponent
                onRegisterSprite={registerSprite}
                onUnregisterSprite={unregisterSprite}
              />
              {opponentSide && (
                <SideConditions side={opponentSide} align="right" />
              )}
            </div>

            {/* Player side — bottom left */}
            <div className="relative z-10 flex flex-col items-start gap-1.5">
              <PokemonSide
                pokemon={myActive}
                gen={battle.gen}
                isOpponent={false}
                onRegisterSprite={registerSprite}
                onUnregisterSprite={unregisterSprite}
              />
              {mySide && (
                <SideConditions side={mySide} align="left" />
              )}
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
          </motion.div>

          {/* Action panel — below battlefield */}
          {state.phase === 'battle' && !state.turnProcessing && (
            <ActionPanel
              battle={battle}
              opponentPokemon={opponentActive}
              pendingChoice={state.pendingChoice}
              onMoveSelect={handleMoveSelect}
              onSwitchSelect={handleSwitchSelect}
              onTeamSelect={handleTeamSelect}
              onCancelChoice={cancelChoice}
            />
          )}

          {/* Mobile-only team rosters */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-2">
              <TeamPanel
                battle={battle}
                sideId={mySideId}
                isPlayer
              />
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-2">
              <TeamPanel
                battle={battle}
                sideId={opponentSideId}
                isPlayer={false}
              />
            </div>
          </div>
        </div>

        {/* Right column: Opponent roster + Battle log */}
        <div className="flex flex-col gap-3">
          {/* Opponent team roster */}
          <div className="hidden lg:block rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-2">
            <TeamPanel
              battle={battle}
              sideId={opponentSideId}
              isPlayer={false}
            />
          </div>

          {/* Battle log — fills remaining space */}
          <div className="flex-1 min-h-0">
            <BattleLog entries={state.logEntries} />
          </div>
        </div>
      </div>
    </div>
  );
}
