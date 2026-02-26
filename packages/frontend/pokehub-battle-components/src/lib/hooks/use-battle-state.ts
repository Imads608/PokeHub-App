'use client';

import { DURATION } from '../animations/easing';
import type { AnimationEvent } from '../types/animation.types';
import {
  type BattleUIState,
  initialBattleUIState,
} from '../types/battle-ui.types';
import { extractAnimationEvent } from '../utils/animation-events';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import {
  Protocol,
  type ArgType,
  type BattleArgsKWArgType,
} from '@pkmn/protocol';
import { LogFormatter } from '@pkmn/view';
import { createClientLogger } from '@pokehub/frontend/shared-logger';
import {
  type ServerBattleEvent,
  TURN_TIMEOUT_SECONDS,
} from '@pokehub/shared/pokemon-battle-types';
import { useCallback, useReducer, useRef, useMemo, useState } from 'react';

/** Local UI actions that don't come from the server */
type LocalUIEvent =
  | { type: 'CHOICE_SUBMITTED'; choice: string }
  | { type: 'CANCEL_CHOICE' }
  | { type: 'RESET' };

export type BattleEvent = ServerBattleEvent | LocalUIEvent;

/**
 * Server events that the reducer handles directly (without protocol processing).
 * BATTLE_START, BATTLE_UPDATE, and BATTLE_RESTORED are intercepted by the
 * dispatch wrapper and converted to internal events before reaching the reducer.
 */
type DirectServerEvent = Exclude<
  ServerBattleEvent,
  | { type: 'BATTLE_START' }
  | { type: 'BATTLE_UPDATE' }
  | { type: 'BATTLE_RESTORED' }
>;

const log = createClientLogger('BattleState');

// Lazily initialized — created once on first use.
let gens: Generations | null = null;
function getGenerations(): Generations {
  if (!gens) gens = new Generations(Dex);
  return gens;
}

/**
 * A single parsed protocol event paired with its animation event (if any).
 * Stored in a queue and processed one at a time — animation plays first,
 * then battle.add() is called to apply the state change.
 */
interface PendingProtocolEvent {
  args: ArgType;
  kwArgs: BattleArgsKWArgType;
  animEvent: AnimationEvent | null;
}

/** Events that change visible state and should trigger a re-render */
const STATE_CHANGING_EVENTS = new Set([
  '-damage',
  '-heal',
  'faint',
  'switch',
  'drag',
  '-boost',
  '-unboost',
  '-status',
  '-curestatus',
  '-weather',
  '-fieldstart',
  '-fieldend',
  '-sidestart',
  '-sideend',
]);

/**
 * Process all protocol text at once (used for BATTLE_START / BATTLE_RESTORED
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

// ── Internal reducer actions (carry pre-processed results) ────────────────

type InternalEvent =
  | { type: '_BATTLE_INITIALIZED'; battleId: string; logLines: string[] }
  | { type: '_BATTLE_UPDATED'; logLines: string[]; turnProcessing?: boolean }
  | { type: '_BATTLE_RESTORED'; battleId: string; logLines: string[] };

type ReducerEvent = DirectServerEvent | LocalUIEvent | InternalEvent;

function newTimer(totalSeconds: number) {
  return { totalSeconds, startedAt: Date.now() };
}

/**
 * Pure reducer — no Battle/LogFormatter mutation happens here.
 * Protocol processing is done in the dispatch wrapper (useBattleState).
 */
function battleReducer(
  state: BattleUIState,
  event: ReducerEvent
): BattleUIState {
  switch (event.type) {
    case 'RESET':
      return initialBattleUIState;

    case 'QUEUE_JOINED':
      return {
        ...state,
        phase: 'queued',
        queuePosition: event.position,
        error: null,
      };

    case 'QUEUE_LEFT':
      return {
        ...state,
        phase: 'idle',
        queuePosition: null,
      };

    case 'MATCH_FOUND':
      return {
        ...state,
        phase: 'matched',
        battleId: event.battleId,
        opponent: event.opponent,
        queuePosition: null,
      };

    case 'MATCH_CANCELLED':
      return {
        ...state,
        phase: 'queued',
        battleId: null,
        opponent: null,
      };

    case '_BATTLE_INITIALIZED':
      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        pendingChoice: null,
        turnTimer: newTimer(TURN_TIMEOUT_SECONDS),
        opponentDisconnected: false,
        disconnectTimeout: null,
        winner: null,
        endReason: null,
        canSaveReplay: false,
        replaySaved: false,
        error: null,
        logEntries: event.logLines,
      };

    case '_BATTLE_UPDATED':
      return {
        ...state,
        pendingChoice: null,
        turnTimer: newTimer(TURN_TIMEOUT_SECONDS),
        turnProcessing: event.turnProcessing ?? false,
        logEntries: [...state.logEntries, ...event.logLines],
      };

    case '_BATTLE_RESTORED':
      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        pendingChoice: null,
        turnTimer: newTimer(TURN_TIMEOUT_SECONDS),
        error: null,
        logEntries: event.logLines,
      };

    case 'BATTLE_END':
      return {
        ...state,
        phase: 'ended',
        winner: event.winner,
        endReason: event.reason,
        canSaveReplay: event.canSaveReplay,
        turnTimer: null,
        opponentDisconnected: false,
        disconnectTimeout: null,
      };

    case 'TURN_WARNING':
      return {
        ...state,
        turnTimer: newTimer(event.secondsRemaining),
      };

    case 'OPPONENT_DISCONNECTED':
      return {
        ...state,
        opponentDisconnected: true,
        disconnectTimeout: event.timeout,
      };

    case 'OPPONENT_RECONNECTED':
      return {
        ...state,
        opponentDisconnected: false,
        disconnectTimeout: null,
      };

    case 'REPLAY_SAVED':
      return {
        ...state,
        replaySaved: true,
      };

    case 'ERROR':
      return {
        ...state,
        error: { code: event.code, message: event.message },
      };

    case 'CHOICE_SUBMITTED':
      return {
        ...state,
        pendingChoice: event.choice,
      };

    case 'CANCEL_CHOICE':
      return {
        ...state,
        pendingChoice: null,
      };

    default:
      return state;
  }
}

/** Function signature for playing a single animation event */
export type PlayAnimationFn = (event: AnimationEvent) => Promise<void>;

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
 * BATTLE_START and BATTLE_RESTORED process everything at once (no animations).
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
   * Process all pending protocol events in a single sequential loop.
   *
   * For each event:
   *   1. If it has an animation and playAnimation is provided → play it
   *   2. Format log line + battle.add() to apply the state change
   *   3. If state-changing → dispatch re-render (so HP/faint/etc. shows)
   *
   * After all events: final dispatch to ensure request/turn/upkeep are applied.
   *
   * This is the ONLY place protocol events are consumed. No sync issues.
   */
  const processPendingEvents = useCallback(
    async (playAnimation?: PlayAnimationFn) => {
      if (processingRef.current) return;

      const battle = battleRef.current;
      const formatter = formatterRef.current;
      const pending = pendingEventsRef.current;
      if (!battle || !formatter || pending.length === 0) return;

      processingRef.current = true;
      skipRef.current = false;

      const logLines: string[] = [];
      let dispatched = false;

      try {
        while (pending.length > 0) {
          const event = pending.shift()!;
          const cmd = String(event.args[0]);

          // Moves: log appears before animation so the player reads what's happening.
          // Switch/drag: handled separately (needs state before animation for sprite mount).
          // Consequences (damage, faint, etc.): log appears after animation.
          const isSwitchEvent = cmd === 'switch' || cmd === 'drag';
          const isActionStarter = cmd === 'move';

          const html = formatter.formatHTML(event.args, event.kwArgs);

          if (isActionStarter) {
            if (html) logLines.push(html);
          }

          // Switch/drag needs special ordering:
          //   1. Animate old Pokemon out (sprite exists before battle.add)
          //   2. battle.add() — old sprite unmounts, new sprite mounts
          //   3. Animate new Pokemon in (sprite exists after battle.add)
          if (isSwitchEvent && playAnimation && !skipRef.current) {
            // Flush log (including switch log line) before animation
            if (html) logLines.push(html);
            if (logLines.length > 0) {
              rawDispatch({
                type: '_BATTLE_UPDATED',
                logLines: [...logLines],
                turnProcessing: true,
              });
              logLines.length = 0;
              dispatched = true;
            }

            await new Promise((r) => setTimeout(r, DURATION.LOG_READ));

            // Animate old Pokemon out (if one exists on this side)
            const sideId = String(event.args[1]).startsWith('p1') ? 'p1' : 'p2';
            const currentActive = battle[sideId]?.active[0];
            if (currentActive && !currentActive.fainted) {
              await playAnimation({
                type: 'switch-out',
                pokemon: `${sideId}a: ${currentActive.name}`,
              });
            }

            // Apply state — old sprite unmounts, new sprite mounts
            battle.add(event.args, event.kwArgs);
            rawDispatch({
              type: '_BATTLE_UPDATED',
              logLines: [...logLines],
              turnProcessing: true,
            });
            logLines.length = 0;
            dispatched = true;

            // Animate new Pokemon in
            await playAnimation(event.animEvent!);
          } else if (isSwitchEvent) {
            // No animation (skipped or off-screen) — just apply state
            if (html) logLines.push(html);
            battle.add(event.args, event.kwArgs);
            rawDispatch({
              type: '_BATTLE_UPDATED',
              logLines: [...logLines],
              turnProcessing: true,
            });
            logLines.length = 0;
            dispatched = true;
          } else {
            if (event.animEvent && playAnimation && !skipRef.current) {
              if (logLines.length > 0) {
                rawDispatch({
                  type: '_BATTLE_UPDATED',
                  logLines: [...logLines],
                  turnProcessing: true,
                });
                logLines.length = 0;
                dispatched = true;
              }

              if (isActionStarter) {
                await new Promise((r) => setTimeout(r, DURATION.LOG_READ));
              }
              await playAnimation(event.animEvent);
            }

            battle.add(event.args, event.kwArgs);

            if (cmd === 'request' && battle.request?.side?.id) {
              formatter.perspective = battle.request.side.id;
            }

            if (STATE_CHANGING_EVENTS.has(cmd)) {
              rawDispatch({
                type: '_BATTLE_UPDATED',
                logLines: [...logLines],
                turnProcessing: true,
              });
              logLines.length = 0;
              dispatched = true;
            }
          }

          // Consequence log lines (damage, heal, etc.) appear after the
          // state change so the player sees the HP bar drop first
          if (!isActionStarter && html) {
            logLines.push(html);
            if (event.animEvent && playAnimation && !skipRef.current) {
              await new Promise((r) => setTimeout(r, DURATION.LOG_READ));
            }
            rawDispatch({
              type: '_BATTLE_UPDATED',
              logLines: [...logLines],
              turnProcessing: true,
            });
            logLines.length = 0;
            dispatched = true;
          }
        }
      } finally {
        // Final dispatch — applies remaining log lines, processes the request,
        // and clears turnProcessing so the action panel reappears.
        if (battle.request) {
          battle.update(battle.request);
        }
        rawDispatch({ type: '_BATTLE_UPDATED', logLines });

        processingRef.current = false;
        skipRef.current = false;
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
    processPendingEvents,
    pendingVersion,
    skipAnimations,
  ] as const;
}

export { battleReducer };
