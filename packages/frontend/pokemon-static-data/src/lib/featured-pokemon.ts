export interface FeaturedPokemon {
  id: string;
  name: string;
  num: number;
  types: string[];
  artwork: string;
}

/**
 * Static data for featured Pokemon displayed on the home page.
 * Uses official artwork URLs from PokeAPI's GitHub sprites repository.
 */
export const FEATURED_POKEMON: FeaturedPokemon[] = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    num: 25,
    types: ['Electric'],
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  },
  {
    id: 'charizard',
    name: 'Charizard',
    num: 6,
    types: ['Fire', 'Flying'],
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
  },
  {
    id: 'mewtwo',
    name: 'Mewtwo',
    num: 150,
    types: ['Psychic'],
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
  },
  {
    id: 'gengar',
    name: 'Gengar',
    num: 94,
    types: ['Ghost', 'Poison'],
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
  },
  {
    id: 'garchomp',
    name: 'Garchomp',
    num: 445,
    types: ['Dragon', 'Ground'],
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png',
  },
  {
    id: 'lucario',
    name: 'Lucario',
    num: 448,
    types: ['Fighting', 'Steel'],
    artwork:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
  },
];
