'use client';

import { useReducer } from 'react';
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
  | { type: 'CHOICE_CANCELLED' };

export type BattleEvent = ServerBattleEvent | LocalUIEvent;

const log = createClientLogger('BattleState');

// Lazily initialized — created once on first use.
let gens: Generations | null = null;
function getGenerations(): Generations {
  if (!gens) gens = new Generations(Dex);
  return gens;
}

/**
 * Feed multi-line protocol text into a @pkmn/client Battle instance.
 *
 * LogFormatter.formatText() is called **before** battle.add() for each line,
 * because the formatter needs the pre-updated state (e.g., HP before damage).
 * Returns an array of formatted log lines.
 */
function processBattleProtocol(
  battle: Battle,
  formatter: LogFormatter,
  text: string
): string[] {
  const logLines: string[] = [];

  for (const line of text.split('\n')) {
    if (!line) continue;

    const parsed = Protocol.parseLine(line);
    if (parsed) {
      const formatted = formatter.formatText(
        parsed as Parameters<LogFormatter['formatText']>[0],
        {} as Parameters<LogFormatter['formatText']>[1]
      );
      if (formatted) logLines.push(formatted);
    }

    battle.add(line);
  }

  if (battle.request) {
    battle.update(battle.request);
  }

  return logLines;
}

function battleReducer(
  state: BattleUIState,
  event: BattleEvent
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

    case 'BATTLE_START': {
      const battle = new Battle(getGenerations());
      const formatter = new LogFormatter('p1', battle);
      const logLines = processBattleProtocol(battle, formatter, event.initialState);

      // Update formatter perspective from the request
      if (battle.request?.side?.id) {
        formatter.perspective = battle.request.side.id;
      }

      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        battle,
        logFormatter: formatter,
        pendingChoice: null,
        turnTimer: null,
        opponentDisconnected: false,
        disconnectTimeout: null,
        winner: null,
        endReason: null,
        canSaveReplay: false,
        replaySaved: false,
        error: null,
        logEntries: logLines,
      };
    }

    case 'BATTLE_UPDATE': {
      if (!state.battle || !state.logFormatter) return state;

      const logLines = processBattleProtocol(
        state.battle,
        state.logFormatter,
        event.data
      );

      return {
        ...state,
        pendingChoice: null,
        logEntries: [...state.logEntries, ...logLines],
      };
    }

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

    case 'BATTLE_RESTORED': {
      const battle = new Battle(getGenerations());
      const formatter = new LogFormatter('p1', battle);
      const logLines = processBattleProtocol(battle, formatter, event.currentState);

      if (battle.request?.side?.id) {
        formatter.perspective = battle.request.side.id;
      }

      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        battle,
        logFormatter: formatter,
        pendingChoice: null,
        error: null,
        logEntries: logLines,
      };
    }

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

    case 'CHOICE_CANCELLED':
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
 * Excludes the Battle instance and LogFormatter (non-serializable, noisy).
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

function battleReducerWithLogging(
  state: BattleUIState,
  event: BattleEvent
): BattleUIState {
  const prev = state.phase;
  const next = battleReducer(state, event);

  if (prev !== next.phase) {
    log.info(`${prev} → ${next.phase}`, {
      event: event.type,
      state: stateSnapshot(next),
    });
  } else {
    log.debug(event.type, { state: stateSnapshot(next) });
  }

  // Log Battle object state for events that modify it
  if (next.battle && (event.type === 'BATTLE_START' || event.type === 'BATTLE_UPDATE' || event.type === 'BATTLE_RESTORED')) {
    log.debug('Battle', battleSnapshot(next.battle));
  }

  return next;
}

export function useBattleState() {
  return useReducer(battleReducerWithLogging, initialBattleUIState);
}

export { battleReducer };
