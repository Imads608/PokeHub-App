'use client';

import { usePokemonDexDetailsContext } from './context/pokemon-dex-details.context';
import { PokemonHeaderContainer } from './header/pokemon-header';
import { useDataProviders } from './hooks/useDataProviders';
import { NavigationPanel } from './navigation/navigation-panel';
import { PokemonTabsContainer } from './tabs/pokemon-tabs-container';
import type { GenerationNum, Species } from '@pkmn/dex';
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
import { Clock, History, CircleAlert } from 'lucide-react';
import type { Pokemon } from 'pokeapi-js-wrapper';
import { useEffect } from 'react';

export function PokemonDetailsContainer() {
  const {
    species,
    forms: { value: pokemonForms, setValue: setPokemonForms },
    selectedGeneration,
    selectedForm,
  } = usePokemonDexDetailsContext();

  const pokemon = species.value as Species;

  const {
    pokedexByID,
    pokeAPICoreRes,
    pokemonFormsRes,
    pokeAPISpeciesRes,
    pokeAPIFormsCoreRes,
  } = useDataProviders();

  useEffect(() => {
    const pokemonFormsCore = pokemonFormsRes.data;
    const pokeAPICore = pokeAPICoreRes.data;

    if (
      !pokemonFormsCore ||
      !pokeAPICore ||
      pokeAPIFormsCoreRes.length === 0 ||
      pokemonForms.length > 0
    ) {
      return;
    }

    const isPokeAPIFormsPending = pokeAPIFormsCoreRes.some((res) => !res.data);
    if (isPokeAPIFormsPending) {
      return;
    }

    const pokeAPIFormsCore = pokeAPIFormsCoreRes.map(
      (res) => res.data as Pokemon
    );

    const forms = [];

    for (const pokemon of pokemonFormsCore) {
      const formName = pokemon.name.toLowerCase();
      if (!formName) {
        continue;
      }
      const pokeAPIForm = pokeAPIFormsCore.find((form) =>
        form.name.toLowerCase().includes(formName.toLowerCase())
      );

      // Base Form should always be first in the list
      if (pokeAPIForm && pokemon.name === pokemon.baseSpecies) {
        forms.unshift({ dex: pokemon, pokeAPI: pokeAPIForm });
      } else if (pokeAPIForm) {
        forms.push({ dex: pokemon, pokeAPI: pokeAPIForm });
      }
    }
    setPokemonForms(forms);
  }, [
    pokemonFormsRes,
    pokeAPIFormsCoreRes,
    pokeAPICoreRes,
    pokemonForms.length,
    pokemon,
  ]);

  useEffect(() => {
    if (pokeAPICoreRes.data && !selectedForm.pokemonPokeAPI.value) {
      selectedForm.pokemonPokeAPI.setValue(pokeAPICoreRes.data);
    }
  }, [pokeAPICoreRes, selectedForm.pokemonPokeAPI.value]);

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
                <CircleAlert className="h-4 w-4" />
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
                pokeAPISpecies={pokeAPISpeciesRes.data}
              />
              <PokemonTabsContainer />
            </>
          )
        )}
      </div>
    </div>
  );
}
