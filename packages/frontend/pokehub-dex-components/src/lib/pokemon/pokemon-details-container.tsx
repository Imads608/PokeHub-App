'use client';

import { usePokemonDexDetailsContext } from './context/pokemon-dex-details.context';
import { PokemonHeaderContainer } from './header/pokemon-header';
import { usePokeAPIFormsDetails } from './hooks/usePokeAPIFormsDetails';
import { usePokemonForms } from './hooks/usePokemonForms';
import { NavigationPanel } from './navigation/navigation-panel';
import { PokemonTabsContainer } from './tabs/pokemon-tabs-container';
import type { GenerationNum, Species } from '@pkmn/dex';
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
import type { Pokemon } from 'pokeapi-js-wrapper';
import { useEffect, useState } from 'react';

export function PokemonDetailsContainer() {
  const { species, selectedGeneration, selectedForm } =
    usePokemonDexDetailsContext();

  const pokemon = species.value as Species;

  // Species Specifc Providers
  const pokemonPokeAPIResult = usePokemonPokeAPIDetails(pokemon.num);
  const pokemonSpeciesPokeAPIResult = usePokemonSpeciesPokeAPIDetails(
    pokemonPokeAPIResult.data?.species.name
  );

  const { data: pokedexByID } = usePokedexByID();

  const pokemonFormsResult = usePokemonForms(pokemon);

  const pokemonPokeAPIFormDetailResults = usePokeAPIFormsDetails(
    pokemonSpeciesPokeAPIResult.data
      ? pokemonSpeciesPokeAPIResult.data.varieties.map(
          (variety) => variety.pokemon.name
        )
      : []
  );

  const [pokemonForms, setPokemonForms] = useState<
    { dex: Species; pokeAPI: Pokemon }[]
  >([]);

  useEffect(() => {
    const pokemonFormsData = pokemonFormsResult.data;
    const pokemonPokeAPIResultData = pokemonPokeAPIResult.data;

    if (
      !pokemonFormsData ||
      !pokemonPokeAPIResultData ||
      pokemonPokeAPIFormDetailResults.length === 0 ||
      pokemonForms.length > 0
    ) {
      return;
    }

    const isPokeAPIFormsPending = pokemonPokeAPIFormDetailResults.some(
      (res) => !res.data
    );
    if (isPokeAPIFormsPending) {
      return;
    }

    const pokemonPokeAPIFormDetailData = pokemonPokeAPIFormDetailResults.map(
      (res) => res.data as Pokemon
    );

    const forms = [{ dex: pokemon, pokeAPI: pokemonPokeAPIResultData }];

    for (const pokemon of pokemonFormsData) {
      const formName = pokemon.baseForme || pokemon.forme;
      if (pokemon.name === pokemon.baseSpecies || !formName) {
        continue;
      }
      const pokeAPIForm = pokemonPokeAPIFormDetailData.find((form) =>
        form.name.toLowerCase().includes(formName.toLowerCase())
      );

      pokeAPIForm && forms.push({ dex: pokemon, pokeAPI: pokeAPIForm });
    }
    setPokemonForms(forms);
  }, [
    pokemonFormsResult,
    pokemonPokeAPIFormDetailResults,
    pokemonPokeAPIResult,
    pokemonForms.length,
    pokemon,
  ]);

  useEffect(() => {
    if (pokemonPokeAPIResult.data && !selectedForm.pokemonPokeAPI.value) {
      selectedForm.pokemonPokeAPI.setValue(pokemonPokeAPIResult.data);
    }
  }, [pokemonPokeAPIResult, selectedForm.pokemonPokeAPI.value]);

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        <NavigationPanel pokemonDetails={pokemon} pokedexByID={pokedexByID} />

        {/* Generation Selector */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">View data from:</span>
            <Select
              value={selectedGeneration.value.toString()}
              onValueChange={(value) =>
                selectedGeneration.setValue(
                  Number.parseInt(value) as GenerationNum
                )
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {getGenerationsData().map(
                  (gen) =>
                    gen.id >= pokemon.gen && (
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
        {selectedGeneration.value !== 9 && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              You are viewing historical data from{' '}
              {getGenerationsData()[selectedGeneration.value - 1].name} (
              {getGenerationsData()[selectedGeneration.value - 1].years})
            </AlertDescription>
          </Alert>
        )}

        {/* Illegal Pokemon Alert */}
        {pokemon.tier === 'Illegal' ||
        (selectedForm.pokemon.value &&
          selectedForm.pokemon.value.gen > selectedGeneration.value) ? (
          <>
            <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertDescription className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Clock className="h-4 w-4" />
                This Pokémon is not obtainable in this Generation.
              </AlertDescription>
            </Alert>
            <PokemonHeaderContainer pokemonForms={pokemonForms} />
          </>
        ) : (
          pokemon && (
            <>
              <PokemonHeaderContainer
                pokemonForms={pokemonForms}
                pokeAPISpecies={pokemonSpeciesPokeAPIResult.data}
              />
              <PokemonTabsContainer />
            </>
          )
        )}
      </div>
    </div>
  );
}
