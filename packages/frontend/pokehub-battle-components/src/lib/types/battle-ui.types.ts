import type { Battle } from '@pkmn/client';
import type { LogFormatter } from '@pkmn/view';
import type { BattleEndReason } from '@pokehub/shared/pokemon-battle-types';

/** Generation-specific battle mechanic (maps to Showdown choice suffixes) */
export type BattleMechanic = 'mega' | 'zmove' | 'dynamax' | 'tera';

/** Known volatile status IDs that we render with specific styling */
export type KnownVolatile =
  | 'confusion'
  | 'substitute'
  | 'leechseed'
  | 'perishsong'
  | 'encore'
  | 'taunt'
  | 'curse'
  | 'yawn'
  | 'flashfire';

/** Known side condition IDs from Showdown's move data */
export type KnownSideCondition =
  | 'stealthrock'
  | 'spikes'
  | 'toxicspikes'
  | 'stickyweb'
  | 'reflect'
  | 'lightscreen'
  | 'auroraveil'
  | 'tailwind'
  | 'safeguard'
  | 'mist'
  | 'luckychant'
  | 'craftyshield'
  | 'matblock'
  | 'quickguard'
  | 'wideguard'
  | 'firepledge'
  | 'grasspledge'
  | 'waterpledge'
  | 'gmaxsteelsurge';

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
  /** True while the turn's protocol events are being processed */
  turnProcessing: boolean;

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

