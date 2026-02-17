import type { Battle } from '@pkmn/client';
import type { LogFormatter } from '@pkmn/view';
import type { BattleEndReason } from '@pokehub/shared/pokemon-battle-types';

export interface BattleUIState {
  phase: 'idle' | 'queued' | 'matched' | 'battle' | 'ended';
  queuePosition: number | null;
  battleId: string | null;
  opponent: { id: string; name: string } | null;

  /** @pkmn/client Battle instance (handles protocol parsing) */
  battle: Battle | null;
  /** @pkmn/view LogFormatter for pretty-printing protocol */
  logFormatter: LogFormatter | null;

  /** Turn timer — totalSeconds is the budget, startedAt is Date.now() when it began */
  turnTimer: { totalSeconds: number; startedAt: number } | null;
  /** The choice submitted this turn (null if none yet) */
  pendingChoice: string | null;

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
  logFormatter: null,
  turnTimer: null,
  pendingChoice: null,
  opponentDisconnected: false,
  disconnectTimeout: null,
  winner: null,
  endReason: null,
  canSaveReplay: false,
  replaySaved: false,
  error: null,
  logEntries: [],
};
