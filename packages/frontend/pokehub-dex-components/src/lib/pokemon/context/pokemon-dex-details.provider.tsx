'use client';

import { usePokemonEvolutionLine } from '../hooks/usePokemonEvolutionLine';
import { PokemonDexDetailsContext } from './pokemon-dex-details.context';
import type { GenerationNum, ID, Species } from '@pkmn/dex';
import { usePokemonDetails } from '@pokehub/frontend/dex-data-provider';
import { isBaseForme } from '@pokehub/frontend/shared-utils';
import type { Pokemon } from 'pokeapi-js-wrapper';
import { useEffect, useState } from 'react';

export interface PokemonDexDetailsProviderProps {
  id: ID;
  children: React.ReactNode;
}

export const PokemonDexDetailsProvider = ({
  id,
  children,
}: PokemonDexDetailsProviderProps) => {
  const [generation, setGeneration] = useState<GenerationNum>(9);

  const { data: pokemon } = usePokemonDetails(id, { generation });

  const [species, setSpecies] = useState<Species | undefined>(pokemon);
  const [selectedPokemon, setSelectedPokemon] = useState<Species | undefined>(
    species
  );
  const [selectedPokemonPokeAPI, setSelectedPokemonPokeAPI] = useState<
    Pokemon | undefined
  >(undefined);

  const [formIndex, setFormIndex] = useState<number | undefined>(undefined);

  // Prefetches
  usePokemonEvolutionLine(
    selectedPokemon && isBaseForme(selectedPokemon) ? selectedPokemon : species,
    { generation }
  );

  useEffect(() => {
    pokemon && setSpecies(pokemon);
  }, [pokemon, generation]);

  useEffect(() => {
    species &&
      (!selectedPokemon || selectedPokemon.id === species.id) &&
      setSelectedPokemon(species);
  }, [species, selectedPokemon, generation]);

  return (
    <PokemonDexDetailsContext.Provider
      value={{
        species: { value: species, setValue: setSpecies },
        selectedGeneration: { value: generation, setValue: setGeneration },
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
      }}
    >
      {!selectedPokemon ? (
        <div className="flex min-h-screen items-center justify-center bg-background pt-20">
          <div className="text-center">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading Pokémon data...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </PokemonDexDetailsContext.Provider>
  );
};

PokemonDexDetailsProvider.displayName = 'PokemonDexDetailsProvider';
