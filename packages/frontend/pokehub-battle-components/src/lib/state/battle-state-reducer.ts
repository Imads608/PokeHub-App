'use client';

import type { BattleUIState } from '../types/battle-ui.types';
import type { AnimationEvent } from '../types/animation.types';
import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import { TURN_TIMEOUT_SECONDS } from '@pokehub/shared/pokemon-battle-types';
import type { ArgType, BattleArgsKWArgType } from '@pkmn/protocol';
import { createClientLogger } from '@pokehub/frontend/shared-logger';

// ── Public types ─────────────────────────────────────────────────────────

/** Local UI actions that don't come from the server */
export type LocalUIEvent =
  | { type: 'CHOICE_SUBMITTED'; choice: string }
  | { type: 'CANCEL_CHOICE' }
  | { type: 'RESET' };

export type BattleEvent = ServerBattleEvent | LocalUIEvent;

/**
 * Server events that the reducer handles directly (without protocol processing).
 * BATTLE_START, BATTLE_UPDATE, and BATTLE_RESTORED are intercepted by the
 * dispatch wrapper and converted to internal events before reaching the reducer.
 */
export type DirectServerEvent = Exclude<
  ServerBattleEvent,
  | { type: 'BATTLE_START' }
  | { type: 'BATTLE_UPDATE' }
  | { type: 'BATTLE_RESTORED' }
>;

/**
 * A single parsed protocol event paired with its animation event (if any).
 * Stored in a queue and processed one at a time — animation plays first,
 * then battle.add() is called to apply the state change.
 */
export interface PendingProtocolEvent {
  args: ArgType;
  kwArgs: BattleArgsKWArgType;
  animEvent: AnimationEvent | null;
}

/** Events that change visible state and should trigger a re-render */
export const STATE_CHANGING_EVENTS = new Set([
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

// ── Internal reducer actions ─────────────────────────────────────────────

export type InternalEvent =
  | { type: '_BATTLE_INITIALIZED'; battleId: string; logLines: string[] }
  | { type: '_BATTLE_UPDATED'; logLines: string[]; turnProcessing?: boolean }
  | { type: '_BATTLE_RESTORED'; battleId: string; logLines: string[] };

export type ReducerEvent = DirectServerEvent | LocalUIEvent | InternalEvent;

// ── Helpers ──────────────────────────────────────────────────────────────

export const log = createClientLogger('BattleState');

export function newTimer(totalSeconds: number) {
  return { totalSeconds, startedAt: Date.now() };
}

// ── Initial state ────────────────────────────────────────────────────────

export const initialBattleUIState: BattleUIState = {
  phase: 'idle',
  queuePosition: null,
  battleId: null,
  opponent: null,
  battle: null,
  logFormatter: null,
  turnTimer: null,
  pendingChoice: null,
  turnProcessing: false,
  opponentDisconnected: false,
  disconnectTimeout: null,
  winner: null,
  endReason: null,
  canSaveReplay: false,
  replaySaved: false,
  error: null,
  logEntries: [],
};

// ── Reducer ──────────────────────────────────────────────────────────────

/**
 * Pure reducer — no Battle/LogFormatter mutation happens here.
 * Protocol processing is done in the dispatch wrapper (useBattleState).
 */
export function battleReducer(
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
