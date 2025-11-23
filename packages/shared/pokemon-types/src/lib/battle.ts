import type { Tier } from '@pkmn/dex';

export type BattleFormat = 'Singles' | 'Doubles';

export interface BattleTier<BF extends BattleFormat = 'Singles'> {
  name: string;
  id: BF extends 'Singles'
    ? Tier.Singles
    : BF extends 'Doubles'
    ? Tier.Doubles
    : never;
  description: string;
}
