import type { BattleFormat, BattleTier } from './battle';
import type {
  SpeciesName,
  ItemName,
  AbilityName,
  PokemonSet,
  GenerationNum,
  MoveName,
} from '@pkmn/dex';

export interface PokemonInTeam extends PokemonSet {
  name: string;
  species: SpeciesName;
  item: ItemName;
  ability: AbilityName;
  moves: MoveName[];
}

export interface PokemonTeam<Format extends BattleFormat> {
  pokemon: PokemonInTeam[];
  generation: GenerationNum;
  format: BattleFormat;
  tier: Format extends 'Singles'
    ? BattleTier<'Singles'>
    : Format extends 'Doubles'
    ? BattleTier<'Doubles'>
    : never;
}
