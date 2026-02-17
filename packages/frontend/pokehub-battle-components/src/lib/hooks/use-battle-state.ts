'use client';

import { useCallback, useReducer, useRef, useMemo } from 'react';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import { Protocol } from '@pkmn/protocol';
import { LogFormatter } from '@pkmn/view';
import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import { createClientLogger } from '@pokehub/frontend/shared-logger';
import {
  type BattleUIState,
  initialBattleUIState,
} from '../types/battle-ui.types';

/** Local UI actions that don't come from the server */
type LocalUIEvent =
  | { type: 'CHOICE_SUBMITTED'; choice: string }
  | { type: 'CANCEL_CHOICE' };

export type BattleEvent = ServerBattleEvent | LocalUIEvent;

const log = createClientLogger('BattleState');

// Lazily initialized — created once on first use.
let gens: Generations | null = null;
function getGenerations(): Generations {
  if (!gens) gens = new Generations(Dex);
  return gens;
}

/**
 * Feed protocol text into a @pkmn/client Battle instance.
 *
 * Follows the official @pkmn/view pattern: for each parsed protocol message,
 * format first (formatter reads pre-damage HP for deltas), then update battle state.
 * Uses formatHTML for rich output (bold names, damage tooltips, etc.).
 * See: https://www.npmjs.com/package/@pkmn/view
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

type ReducerEvent = ServerBattleEvent | LocalUIEvent | InternalEvent;

/**
 * Pure reducer — no Battle/LogFormatter mutation happens here.
 * Protocol processing is done in the dispatch wrapper (useBattleState).
 */
function battleReducer(
  state: BattleUIState,
  event: ReducerEvent
): BattleUIState {
  switch (event.type) {
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
        turnTimer: null,
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
        logEntries: [...state.logEntries, ...event.logLines],
      };

    case '_BATTLE_RESTORED':
      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        pendingChoice: null,
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
        turnTimer: {
          secondsRemaining: event.secondsRemaining,
          warning: event.secondsRemaining <= 30,
        },
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

/**
 * Battle state hook.
 *
 * Protocol processing (which mutates the Battle object) happens in the
 * dispatch wrapper, not in the reducer. This keeps the reducer pure and
 * prevents React strict mode from double-processing protocol data.
 *
 * - Battle & LogFormatter live in refs (mutable singletons)
 * - Reducer only handles serializable state transitions
 * - dispatch wrapper processes protocol once, then dispatches pre-computed results
 */
export function useBattleState() {
  const battleRef = useRef<Battle | null>(null);
  const formatterRef = useRef<LogFormatter | null>(null);

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

        log.info('→ battle', { event: 'BATTLE_START', battleId: event.battleId });
        log.debug('Battle', battleSnapshot(battle));

        rawDispatch({ type: '_BATTLE_INITIALIZED', battleId: event.battleId, logLines });
        break;
      }

      case 'BATTLE_UPDATE': {
        const battle = battleRef.current;
        const formatter = formatterRef.current;
        if (!battle || !formatter) return;

        const logLines = processBattleProtocol(battle, formatter, event.data);

        log.debug('BATTLE_UPDATE', { newLogLines: logLines.length });
        log.debug('Battle', battleSnapshot(battle));

        rawDispatch({ type: '_BATTLE_UPDATED', logLines });
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

  return [state, dispatch] as const;
}

export { battleReducer };
