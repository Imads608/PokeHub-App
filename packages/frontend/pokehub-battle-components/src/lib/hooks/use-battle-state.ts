'use client';

import { useReducer } from 'react';
import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/dex';
import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import {
  type BattleUIState,
  initialBattleUIState,
} from '../types/battle-ui.types';

// Lazily initialized — created once on first use.
let gens: Generations | null = null;
function getGenerations(): Generations {
  if (!gens) gens = new Generations(Dex);
  return gens;
}

/**
 * Feed multi-line protocol text into a @pkmn/client Battle instance.
 * The Battle instance handles all protocol parsing — turn tracking,
 * request parsing, win detection, pokemon state, field conditions, etc.
 */
function processBattleProtocol(battle: Battle, text: string): void {
  for (const line of text.split('\n')) {
    if (line) battle.add(line);
  }
  if (battle.request) {
    battle.update(battle.request);
  }
}

function battleReducer(
  state: BattleUIState,
  event: ServerBattleEvent
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
      processBattleProtocol(battle, event.initialState);

      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        battle,
        pendingChoice: false,
        turnTimer: null,
        opponentDisconnected: false,
        disconnectTimeout: null,
        winner: null,
        endReason: null,
        canSaveReplay: false,
        replaySaved: false,
        error: null,
        logEntries: [event.initialState],
      };
    }

    case 'BATTLE_UPDATE': {
      if (!state.battle) return state;

      // Feed protocol to the Battle instance — it handles all parsing
      // (turn tracking, request, pokemon state, field, win detection, etc.)
      processBattleProtocol(state.battle, event.data);

      return {
        ...state,
        pendingChoice: false,
        logEntries: [...state.logEntries, event.data],
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
      processBattleProtocol(battle, event.currentState);

      return {
        ...state,
        phase: 'battle',
        battleId: event.battleId,
        battle,
        pendingChoice: false,
        error: null,
        logEntries: [event.currentState],
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

    default:
      return state;
  }
}

export function useBattleState() {
  return useReducer(battleReducer, initialBattleUIState);
}

export { battleReducer };
