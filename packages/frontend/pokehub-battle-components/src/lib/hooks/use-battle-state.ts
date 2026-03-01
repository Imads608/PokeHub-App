'use client';

import type { BattleUIState } from '../types/battle-ui.types';
import { extractAnimationEvent } from '../utils/animation-events';
import { loadServerMoveConfigs } from '../animations/move-registry';
import {
  battleReducer,
  initialBattleUIState,
  log,
  type BattleEvent,
  type PendingProtocolEvent,
  type ReducerEvent,
} from '../state/battle-state-reducer';
import {
  processPendingEvents,
  type PlayAnimationFn,
} from '../state/process-pending-events';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';
import { LogFormatter } from '@pkmn/view';
import { useCallback, useReducer, useRef, useMemo, useState } from 'react';

export type { PlayAnimationFn } from '../state/process-pending-events';
export type { BattleEvent } from '../state/battle-state-reducer';

// Lazily initialized — created once on first use.
let gens: Generations | null = null;
function getGenerations(): Generations {
  if (!gens) gens = new Generations(Dex);
  return gens;
}

/**
 * Process all protocol text at once (used for BATTLE_RESTORED
 * where we don't need incremental animations).
 */
function processBattleProtocol(
  battle: Battle,
  formatter: LogFormatter,
  text: string
): string[] {
  const logLines: string[] = [];

  for (const { args, kwArgs } of Protocol.parse(text)) {
    const html = formatter.formatHTML(args, kwArgs);
    if (html) logLines.push(html);
    battle.add(args, kwArgs);
  }

  if (battle.request) {
    battle.update(battle.request);
  }

  return logLines;
}

/**
 * Battle state hook.
 *
 * Protocol processing for BATTLE_UPDATE uses deferred application:
 *
 * 1. Parse protocol into individual events, extract animation events.
 *    Battle state is NOT mutated yet (so we can read prevHp etc.).
 *
 * 2. `processPendingEvents(playAnimation?)` iterates each event in a
 *    single loop: play animation (if any) → battle.add() → re-render
 *    on state-changing events. Every protocol event gets processed.
 *
 * BATTLE_START queues events for animated processing via processPendingEvents.
 * BATTLE_RESTORED processes everything at once (no animations).
 */
export function useBattleState() {
  const battleRef = useRef<Battle | null>(null);
  const formatterRef = useRef<LogFormatter | null>(null);

  /** Queue of parsed protocol events waiting to be processed */
  const pendingEventsRef = useRef<PendingProtocolEvent[]>([]);
  /** Bumped on each BATTLE_UPDATE to signal new events are ready */
  const [pendingVersion, setPendingVersion] = useState(0);
  /** Prevents re-entrant calls to processPendingEvents */
  const processingRef = useRef(false);
  /** Set to true to skip remaining animations (events still get applied) */
  const skipRef = useRef(false);
  /** BATTLE_END deferred until animations finish */
  const deferredEndRef = useRef<ReducerEvent | null>(null);

  const [reducerState, rawDispatch] = useReducer(
    battleReducer,
    initialBattleUIState
  );

  const dispatch = useCallback((event: BattleEvent) => {
    switch (event.type) {
      case 'BATTLE_START': {
        const battle = new Battle(getGenerations());
        const formatter = new LogFormatter('p1', battle);

        battleRef.current = battle;
        formatterRef.current = formatter;

        // Load server-delivered move animation configs
        loadServerMoveConfigs(event.moveAnimConfigs);

        // Queue all events for animated processing (same as BATTLE_UPDATE)
        const newEvents: PendingProtocolEvent[] = [];
        for (const { args, kwArgs } of Protocol.parse(event.initialState)) {
          const animEvent = extractAnimationEvent(args, battle);
          newEvents.push({ args, kwArgs, animEvent });
        }
        pendingEventsRef.current = newEvents;

        log.info('→ battle', {
          event: 'BATTLE_START',
          battleId: event.battleId,
        });

        rawDispatch({
          type: '_BATTLE_INITIALIZED',
          battleId: event.battleId,
          logLines: [],
        });

        // Trigger processing (same mechanism as BATTLE_UPDATE)
        setPendingVersion((v) => v + 1);
        break;
      }

      case 'BATTLE_UPDATE': {
        const battle = battleRef.current;
        if (!battle) return;

        // Parse protocol into individual events WITHOUT mutating battle.
        // Animation events are extracted now (reading current HP for prevHp).
        // Actual state mutation happens later via processPendingEvents().
        const newEvents: PendingProtocolEvent[] = [];
        for (const { args, kwArgs } of Protocol.parse(event.data)) {
          const animEvent = extractAnimationEvent(args, battle);
          newEvents.push({ args, kwArgs, animEvent });
        }

        // Append to existing queue (handles events arriving mid-processing)
        pendingEventsRef.current.push(...newEvents);
        setPendingVersion((v) => v + 1);

        log.debug('BATTLE_UPDATE', {
          totalEvents: newEvents.length,
          animEvents: newEvents.filter((e) => e.animEvent).length,
        });
        break;
      }

      case 'BATTLE_RESTORED': {
        const battle = new Battle(getGenerations());
        const formatter = new LogFormatter('p1', battle);

        // Load server-delivered move animation configs
        loadServerMoveConfigs(event.moveAnimConfigs);

        const logLines = processBattleProtocol(
          battle,
          formatter,
          event.currentState
        );

        if (battle.request?.side?.id) {
          formatter.perspective = battle.request.side.id;
        }

        battleRef.current = battle;
        formatterRef.current = formatter;
        pendingEventsRef.current = [];

        log.info('→ battle (restored)', {
          event: 'BATTLE_RESTORED',
          battleId: event.battleId,
        });
        log.debug('Battle', battle);

        rawDispatch({
          type: '_BATTLE_RESTORED',
          battleId: event.battleId,
          logLines,
        });
        break;
      }

      case 'BATTLE_END': {
        if (processingRef.current || pendingEventsRef.current.length > 0) {
          log.info('Deferring BATTLE_END until animations finish');
          deferredEndRef.current = event;
        } else {
          rawDispatch(event);
        }
        break;
      }

      default: {
        log.debug(event.type);
        rawDispatch(event);
      }
    }
  }, []);

  // Combine reducer state with ref-held Battle/LogFormatter
  const state: BattleUIState = useMemo(
    () => ({
      ...reducerState,
      battle: battleRef.current,
      logFormatter: formatterRef.current,
    }),
    [reducerState]
  );

  /**
   * Thin wrapper around processPendingEvents — manages re-entrancy guard
   * and final cleanup (battle.update + turnProcessing: false).
   */
  const processEvents = useCallback(
    async (playAnimation?: PlayAnimationFn) => {
      if (processingRef.current) return;

      const battle = battleRef.current;
      const formatter = formatterRef.current;
      const pending = pendingEventsRef.current;
      if (!battle || !formatter || pending.length === 0) return;

      processingRef.current = true;
      skipRef.current = false;

      try {
        await processPendingEvents(
          { battle, formatter, pending, skipRef, rawDispatch },
          playAnimation
        );
      } finally {
        if (battle.request) {
          battle.update(battle.request);
        }
        rawDispatch({ type: '_BATTLE_UPDATED', logLines: [] });

        processingRef.current = false;
        skipRef.current = false;

        // Flush deferred BATTLE_END now that animations are done
        const deferred = deferredEndRef.current;
        if (deferred) {
          deferredEndRef.current = null;
          rawDispatch(deferred);
        }
      }
    },
    []
  );

  /** Skip remaining animations (events still get applied immediately) */
  const skipAnimations = useCallback(() => {
    skipRef.current = true;
  }, []);

  return [
    state,
    dispatch,
    processEvents,
    pendingVersion,
    skipAnimations,
  ] as const;
}

export { battleReducer };
