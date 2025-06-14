import { usePokemonDexDetailsContext } from '../context/pokemon-dex-details.context';
import { usePokeAPIFormsDetails } from './usePokeAPIFormsDetails';
import { usePokemonEvolutionLine } from './usePokemonEvolutionLine';
import { usePokemonForms } from './usePokemonForms';
import type { Species } from '@pkmn/dex';
import {
  usePokedexByID,
  usePokemonLearnset,
  usePokemonPokeAPIDetails,
  usePokemonSpeciesPokeAPIDetails,
} from '@pokehub/frontend/dex-data-provider';
import { isBaseForme } from '@pokehub/frontend/shared-utils';

export const useDataProviders = () => {
  const {
    species,
    selectedGeneration: { value: generation },
    selectedForm: {
      pokemon: { value: selectedPokemon },
    },
  } = usePokemonDexDetailsContext();

  const baseSpecies = species.value as Species;

  // Species Specifc Providers
  const pokemonPokeAPIResult = usePokemonPokeAPIDetails(
    selectedPokemon?.name.toLowerCase()
  );
  const pokemonSpeciesPokeAPIResult = usePokemonSpeciesPokeAPIDetails(
    pokemonPokeAPIResult.data?.species.name
  );

  const { data: pokedexByID } = usePokedexByID();

  const pokemonFormsResult = usePokemonForms(baseSpecies);

  const pokemonPokeAPIFormDetailResults = usePokeAPIFormsDetails(
    pokemonSpeciesPokeAPIResult.data
      ? pokemonSpeciesPokeAPIResult.data.varieties.map(
          (variety) => variety.pokemon.name
        )
      : []
  );

  // Prefetches
  usePokemonEvolutionLine(
    selectedPokemon && isBaseForme(selectedPokemon)
      ? selectedPokemon
      : baseSpecies,
    { generation }
  );

  usePokemonLearnset(
    selectedPokemon && isBaseForme(selectedPokemon)
      ? selectedPokemon.id
      : baseSpecies.id,
    { generation }
  );

  return {
    pokeAPICoreRes: pokemonPokeAPIResult,
    pokeAPISpeciesRes: pokemonSpeciesPokeAPIResult,
    pokemonFormsRes: pokemonFormsResult,
    pokeAPIFormsCoreRes: pokemonPokeAPIFormDetailResults,
    pokedexByID,
  };
};
