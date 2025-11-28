import type {
  SpeciesName,
  ItemName,
  AbilityName,
  PokemonSet,
  GenerationNum,
  MoveName,
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

export interface PokemonTeam {
  name: string;
  pokemon: PokemonInTeam[];
  generation: GenerationNum;
  /**
   * Format ID (Showdown format without gen prefix)
   * Examples: 'ou', 'vgc2024rege', 'nationaldex', 'monotypefire'
   */
  format: string;
}
