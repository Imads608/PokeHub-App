'use client';

import { usePokemonDexDetails } from '../hooks/usePokemonDexDetails';
import { usePokemonEvolutionLine } from '../hooks/usePokemonEvolutionLine';
import { PokemonDexDetailsContext } from './pokemon-dex-details.context';
import type { GenerationNum, ID, Species } from '@pkmn/dex';
import { isBaseForme } from '@pokehub/frontend/shared-utils';
import type { Pokemon } from 'pokeapi-js-wrapper';
import { useEffect, useState } from 'react';

export interface PokemonDexDetailsProviderProps {
  children: React.ReactNode;
}

export const PokemonDexDetailsProvider = ({
  children,
}: PokemonDexDetailsProviderProps) => {
  const [generation, setGeneration] = useState<GenerationNum>(9);
  const [dexID, setDexID] = useState<ID | undefined>(undefined);

  const { data: pokemonDexDetails } = usePokemonDexDetails(dexID, {
    generation,
  });

  const [species, setSpecies] = useState<Species | undefined>(
    pokemonDexDetails?.baseSpecies
  );
  const [selectedPokemon, setSelectedPokemon] = useState<Species | undefined>(
    pokemonDexDetails?.pokemon
  );
  const [selectedPokemonPokeAPI, setSelectedPokemonPokeAPI] = useState<
    Pokemon | undefined
  >(undefined);

  const [formIndex, setFormIndex] = useState<number | undefined>(undefined);

  const [selectedTab, setSelectedTab] = useState<
    'Stats' | 'Evolution' | 'Moves'
  >('Stats');

  const [pokemonForms, setPokemonForms] = useState<
    { dex: Species; pokeAPI: Pokemon }[]
  >([]);

  // Prefetches
  usePokemonEvolutionLine(
    selectedPokemon && isBaseForme(selectedPokemon) ? selectedPokemon : species,
    { generation }
  );

  useEffect(() => {
    pokemonDexDetails && setSpecies(pokemonDexDetails.baseSpecies);
  }, [pokemonDexDetails]);

  // Reset Selected Pokemon when generation changes
  useEffect(() => {
    setSelectedPokemon(undefined);
    setSelectedPokemonPokeAPI(undefined);
    setFormIndex(undefined);
  }, [generation]);

  // Set Default Pokemon to one provided by DexID
  useEffect(() => {
    pokemonDexDetails &&
      !selectedPokemon &&
      setSelectedPokemon(pokemonDexDetails.pokemon);
  }, [pokemonDexDetails, selectedPokemon, generation]);

  return (
    <PokemonDexDetailsContext.Provider
      value={{
        id: { value: dexID, setValue: setDexID },
        species: { value: species, setValue: setSpecies },
        selectedGeneration: {
          value: generation,
          setValue: setGeneration,
        },
        selectedTab: { value: selectedTab, setValue: setSelectedTab },
        selectedForm: {
          pokemon: {
            value: selectedPokemon,
            setValue: setSelectedPokemon,
          },
          pokemonPokeAPI: {
            value: selectedPokemonPokeAPI,
            setValue: setSelectedPokemonPokeAPI,
          },
          index: {
            value: formIndex,
            setValue: setFormIndex,
          },
        },
        forms: { value: pokemonForms, setValue: setPokemonForms },
      }}
    >
      {children}
    </PokemonDexDetailsContext.Provider>
  );
};

PokemonDexDetailsProvider.displayName = 'PokemonDexDetailsProvider';
