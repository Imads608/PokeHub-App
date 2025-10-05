import type { GenerationNum, ID, Species } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';
import type { Pokemon } from 'pokeapi-js-wrapper';

export interface PokemonDexDetails<T extends ContextFieldType> {
  id: ContextField<ID | undefined, T>;
  species: ContextField<Species | undefined, 'ReadWrite'>;
  selectedForm: {
    pokemon: ContextField<Species | undefined, T>;
    pokemonPokeAPI: ContextField<Pokemon | undefined, T>;
    index: ContextField<number | undefined, T>;
  };
  forms: ContextField<{ dex: Species; pokeAPI: Pokemon }[], T>;
  selectedTab: ContextField<'Stats' | 'Evolution' | 'Moves', T>;
  selectedGeneration: ContextField<GenerationNum, T>;
}
