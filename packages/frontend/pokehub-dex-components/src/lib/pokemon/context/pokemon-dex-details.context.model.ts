import type { GenerationNum, Species } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';
import type { Pokemon } from 'pokeapi-js-wrapper';

export interface PokemonDexDetails<T extends ContextFieldType> {
  species: ContextField<Species | undefined, 'ReadWrite'>;
  selectedForm: {
    pokemon: ContextField<Species | undefined, T>;
    pokemonPokeAPI: ContextField<Pokemon | undefined, T>;
    index: ContextField<number | undefined, T>;
  };
  selectedGeneration: ContextField<GenerationNum, T>;
}
