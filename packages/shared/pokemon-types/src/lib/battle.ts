import type { Tier } from '@pkmn/dex';

// Re-export BattleFormat from shared package
export type { BattleFormat } from '@pokehub/shared/shared-team-models';

export interface BattleTier<BF extends BattleFormat = 'Singles'> {
  name: string;
  id: BF extends 'Singles'
    ? Tier.Singles
    : BF extends 'Doubles'
    ? Tier.Doubles
    : never;
  description: string;
}
