'use client';

import { PokemonHeaderContainer } from './header/pokemon-header';
import { NavigationPanel } from './navigation/navigation-panel';
import { PokemonTabsContainer } from './tabs/pokemon-tabs-container';
import { GenerationNum, Species } from '@pkmn/dex';
import {
  usePokedexByID,
  usePokemonPokeAPIDetails,
  usePokemonSpeciesPokeAPIDetails,
} from '@pokehub/frontend/dex-data-provider';
import {
  Alert,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pokehub/frontend/shared-ui-components';
import { getGenerationsData } from '@pokehub/frontend/shared-utils';
import { Clock, History } from 'lucide-react';

export interface PokemonDetailsContainerProps {
  pokemonDetails: Species;
  id: string;
  generation: GenerationNum;
  setGeneration: (generation: GenerationNum) => void;
}

export function PokemonDetailsContainer({
  pokemonDetails,
  id,
  generation,
  setGeneration,
}: PokemonDetailsContainerProps) {
  const { data: pokemonPokeAPIDetails } = usePokemonPokeAPIDetails(
    pokemonDetails?.num
  );
  const { data: pokemonSpeciesPokeAPIDetails } =
    usePokemonSpeciesPokeAPIDetails(pokemonPokeAPIDetails?.species.name);

  const { data: pokedexByID } = usePokedexByID();

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        <NavigationPanel
          pokemonDetails={pokemonDetails}
          pokedexByID={pokedexByID}
        />

        {/* Generation Selector */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">View data from:</span>
            <Select
              value={generation.toString()}
              onValueChange={(value) =>
                setGeneration(Number.parseInt(value) as GenerationNum)
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {getGenerationsData().map(
                  (gen) =>
                    gen.id >= pokemonDetails.gen && (
                      <SelectItem key={gen.id} value={gen.id.toString()}>
                        {gen.name} ({gen.games})
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Historical View Alert */}
        {generation !== 9 && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              You are viewing historical data from{' '}
              {getGenerationsData()[generation - 1].name} (
              {getGenerationsData()[generation - 1].years})
            </AlertDescription>
          </Alert>
        )}

        {/* Illegal Pokemon Alert */}
        {pokemonDetails.tier === 'Illegal' && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              This Pokémon is not obtainable in this Generation.
            </AlertDescription>
          </Alert>
        )}

        {/* Pokemon Header */}
        <PokemonHeaderContainer
          pokemonSpeciesPokeAPIDetails={pokemonSpeciesPokeAPIDetails}
          pokemonDetails={pokemonDetails}
          pokemonPokeAPIDetails={pokemonPokeAPIDetails}
        />
        <PokemonTabsContainer
          pokemonDetails={pokemonDetails}
          generation={generation}
        />
      </div>
    </div>
  );
}
