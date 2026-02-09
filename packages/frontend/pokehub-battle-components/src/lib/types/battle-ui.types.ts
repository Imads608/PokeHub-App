import type { Battle } from '@pkmn/client';
import type { BattleEndReason } from '@pokehub/shared/pokemon-battle-types';

export interface BattleUIState {
  phase: 'idle' | 'queued' | 'matched' | 'battle' | 'ended';
  queuePosition: number | null;
  battleId: string | null;
  opponent: { id: string; name: string } | null;

  /** @pkmn/client Battle instance (handles protocol parsing) */
  battle: Battle | null;

  /** Turn state */
  turnTimer: { secondsRemaining: number; warning: boolean } | null;
  /** Has user submitted a choice this turn? */
  pendingChoice: boolean;

  /** Disconnection */
  opponentDisconnected: boolean;
  disconnectTimeout: number | null;

  /** End state */
  winner: string | null;
  endReason: BattleEndReason | null;
  canSaveReplay: boolean;
  replaySaved: boolean;

  /** Error */
  error: { code: string; message: string } | null;

  /** Log */
  logEntries: string[];
}

export const initialBattleUIState: BattleUIState = {
  phase: 'idle',
  queuePosition: null,
  battleId: null,
  opponent: null,
  battle: null,
  turnTimer: null,
  pendingChoice: false,
  opponentDisconnected: false,
  disconnectTimeout: null,
  winner: null,
  endReason: null,
  canSaveReplay: false,
  replaySaved: false,
  error: null,
  logEntries: [],
};
