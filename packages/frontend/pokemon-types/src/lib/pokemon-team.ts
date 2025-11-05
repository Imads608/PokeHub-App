import type { BattleFormat } from './battle';
import type {
  SpeciesName,
  ItemName,
  AbilityName,
  PokemonSet,
  GenerationNum,
  MoveName,
  Tier,
  NatureName,
  GenderName,
} from '@pkmn/dex';

export interface PokemonInTeam extends PokemonSet {
  species: SpeciesName;
  item: ItemName;
  ability: AbilityName;
  nature: NatureName;
  gender: GenderName;
  moves: MoveName[];
}

export interface PokemonTeam<Format extends BattleFormat> {
  name: string;
  pokemon: PokemonInTeam[];
  generation: GenerationNum;
  format: BattleFormat;
  tier: Format extends 'Singles'
    ? Tier.Singles
    : Format extends 'Doubles'
    ? Tier.Doubles
    : never;
}
