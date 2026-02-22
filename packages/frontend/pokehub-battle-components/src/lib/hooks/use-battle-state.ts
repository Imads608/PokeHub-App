'use client';

import { useCallback, useReducer, useRef, useMemo, useState } from 'react';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Protocol, type ArgType, type BattleArgsKWArgType } from '@pkmn/protocol';
import { LogFormatter } from '@pkmn/view';
import {
  type ServerBattleEvent,
  TURN_TIMEOUT_SECONDS,
} from '@pokehub/shared/pokemon-battle-types';
import { createClientLogger } from '@pokehub/frontend/shared-logger';
import {
  type BattleUIState,
  initialBattleUIState,
} from '../types/battle-ui.types';
import type { AnimationEvent } from '../types/animation.types';
import { extractAnimationEvent } from './animation-events';

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
  '-damage', '-heal', 'faint', 'switch', 'drag',
  '-boost', '-unboost', '-status', '-curestatus',
  '-weather', '-fieldstart', '-fieldend',
  '-sidestart', '-sideend',
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
  | { type: '_BATTLE_UPDATED'; logLines: string[] }
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

/**
 * Picks the serializable, human-readable fields from BattleUIState for logging.
 */
function stateSnapshot(state: BattleUIState) {
  return {
    phase: state.phase,
    battleId: state.battleId,
    opponent: state.opponent,
    pendingChoice: state.pendingChoice,
    opponentDisconnected: state.opponentDisconnected,
    winner: state.winner,
    endReason: state.endReason,
    turnTimer: state.turnTimer,
    error: state.error,
    logEntriesCount: state.logEntries.length,
  };
}

/**
 * Extracts a human-readable snapshot from the @pkmn/client Battle instance.
 */
function battleSnapshot(battle: Battle) {
  const p1Active = battle.p1.active[0];
  const p2Active = battle.p2.active[0];

  const request = battle.request;
  let requestInfo: { type: string; moves?: string[] } | null = null;
  if (request) {
    requestInfo = { type: request.requestType };
    if (request.requestType === 'move' && request.active?.[0]) {
      requestInfo.moves = request.active[0].moves.map((m) => m.name);
    }
  }

  return {
    turn: battle.turn,
    perspective: request?.side?.id ?? null,
    p1: {
      name: battle.p1.name,
      active: p1Active
        ? { species: p1Active.speciesForme, hp: `${p1Active.hp}/${p1Active.maxhp}`, status: p1Active.status }
        : null,
      teamSize: battle.p1.totalPokemon,
      faints: battle.p1.faints,
    },
    p2: {
      name: battle.p2.name,
      active: p2Active
        ? { species: p2Active.speciesForme, hp: `${p2Active.hp}/${p2Active.maxhp}`, status: p2Active.status }
        : null,
      teamSize: battle.p2.totalPokemon,
      faints: battle.p2.faints,
    },
    field: {
      weather: battle.field.weather ?? null,
      terrain: battle.field.terrain ?? null,
    },
    request: requestInfo,
  };
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

  const [reducerState, rawDispatch] = useReducer(battleReducer, initialBattleUIState);

  const dispatch = useCallback((event: BattleEvent) => {
    switch (event.type) {
      case 'BATTLE_START': {
        const battle = new Battle(getGenerations());
        const formatter = new LogFormatter('p1', battle);
        const logLines = processBattleProtocol(battle, formatter, event.initialState);

        if (battle.request?.side?.id) {
          formatter.perspective = battle.request.side.id;
        }

        battleRef.current = battle;
        formatterRef.current = formatter;
        pendingEventsRef.current = [];

        log.info('→ battle', { event: 'BATTLE_START', battleId: event.battleId });
        log.debug('Battle', battleSnapshot(battle));

        rawDispatch({ type: '_BATTLE_INITIALIZED', battleId: event.battleId, logLines });
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
        const logLines = processBattleProtocol(battle, formatter, event.currentState);

        if (battle.request?.side?.id) {
          formatter.perspective = battle.request.side.id;
        }

        battleRef.current = battle;
        formatterRef.current = formatter;
        pendingEventsRef.current = [];

        log.info('→ battle (restored)', { event: 'BATTLE_RESTORED', battleId: event.battleId });
        log.debug('Battle', battleSnapshot(battle));

        rawDispatch({ type: '_BATTLE_RESTORED', battleId: event.battleId, logLines });
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
  const processPendingEvents = useCallback(async (playAnimation?: PlayAnimationFn) => {
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

        // Play animation before applying state (so prevHp is still visible)
        if (event.animEvent && playAnimation && !skipRef.current) {
          await playAnimation(event.animEvent);
        }

        // Apply the protocol event to battle state
        const html = formatter.formatHTML(event.args, event.kwArgs);
        if (html) logLines.push(html);
        battle.add(event.args, event.kwArgs);

        // Re-render after state-changing events so the UI updates
        // between animations (HP drops after damage anim, faint shows, etc.)
        const cmd = String(event.args[0]);
        if (STATE_CHANGING_EVENTS.has(cmd)) {
          // Do NOT call battle.update(request) here — the request still
          // contains the previous turn's HP/status. update() overwrites
          // pokemon.hp from the request, undoing the battle.add() mutation.
          // We call update() only in the final dispatch after all events
          // (including the new |request|) have been processed.
          rawDispatch({ type: '_BATTLE_UPDATED', logLines: [...logLines] });
          logLines.length = 0;
          dispatched = true;
        }
      }
    } finally {
      // Final dispatch for remaining log lines and non-state-changing events
      // (request, upkeep, turn, etc.)
      if (battle.request) battle.update(battle.request);
      if (logLines.length > 0 || !dispatched) {
        rawDispatch({ type: '_BATTLE_UPDATED', logLines });
      }

      processingRef.current = false;
      skipRef.current = false;
    }
  }, []);

  /** Skip remaining animations (events still get applied immediately) */
  const skipAnimations = useCallback(() => {
    skipRef.current = true;
  }, []);

  return [state, dispatch, processPendingEvents, pendingVersion, skipAnimations] as const;
}

export { battleReducer };
