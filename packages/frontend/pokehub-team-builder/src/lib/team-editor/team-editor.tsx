'use client';

import { useTeamEditorContext } from '../context/team-editor.context';
import { EmptySlot } from './empty-slot';
import { PokemonCard } from './pokemon-card';
import { TeamConfigurationSection } from './team-configuration-section';
import type { Species, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { getPokemonDetailsByName } from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import { validateTeam } from '@pokehub/frontend/pokemon-types';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { useCallback, useMemo, useState, Suspense, lazy } from 'react';

// Lazy load dialog components for better performance
// webpackPrefetch tells the browser to prefetch these during idle time
const PokemonSelector = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "pokemon-selector" */
    './pokemon-selector/pokemon-selector'
  ).then((mod) => ({
    default: mod.PokemonSelector,
  }))
);

const PokemonEditor = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "pokemon-editor" */
    './pokemon-editor/pokemon-editor'
  ).then((mod) => ({
    default: mod.PokemonEditor,
  }))
);

export const TeamEditor = () => {
  // State for team configuration

  const { teamPokemon, generation, tier, activePokemon, teamName, format } =
    useTeamEditorContext();
  //const [, setIsTeamAnalysisOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [isPokemonSelectorOpen, setIsPokemonSelectorOpen] = useState(false);
  const [isPokemonEditorOpen, setIsPokemonEditorOpen] = useState(false);
  const [speciesList] = useState<(Species | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  // Validate team
  const validationResult = useMemo(() => {
    return validateTeam({
      name: teamName.value,
      generation: generation.value,
      format: format.value,
      tier: tier.value,
      pokemon: teamPokemon.value,
    });
  }, [
    teamName.value,
    generation.value,
    format.value,
    tier.value,
    teamPokemon.value,
  ]);

  const onPokemonSelected = useCallback(
    (pokemon: Species | PokemonInTeam, slot?: number) => {
      activePokemon.setValue(pokemon);
      setIsPokemonSelectorOpen(false);
      setIsPokemonEditorOpen(true);
      slot && setActiveSlot(slot);
      const currSlot = slot || activeSlot;

      if (!speciesList[currSlot - 1]) {
        if ('exists' in pokemon) {
          pokemon = pokemon as Species;
          speciesList[currSlot - 1] = pokemon;
        } else {
          pokemon = pokemon as PokemonInTeam;
          speciesList[currSlot - 1] = getPokemonDetailsByName(
            pokemon.species,
            generation.value
          );
        }
      }
    },
    [activeSlot, generation.value]
  );

  const onAddPokemonToTeam = useCallback(() => {
    teamPokemon.addActivePokemonToTeam(activeSlot);
    setIsPokemonEditorOpen(false);
  }, [activeSlot, teamPokemon]);

  return (
    <>
      {/* Team Configuration */}
      <TeamConfigurationSection />

      {/* Team Builder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamPokemon.value.map((pokemon, index) => (
          <div key={index}>
            {pokemon ? (
              <PokemonCard
                isPokemonEditorOpen
                pokemon={pokemon}
                generation={generation.value}
                onRemove={() => teamPokemon.removePokemonFromTeam(index + 1)}
                onEdit={() => onPokemonSelected(pokemon, index + 1)}
                validationResult={validationResult}
                slotIndex={index}
              />
            ) : (
              <EmptySlot
                index={index}
                onClick={() => {
                  setActiveSlot(index + 1);
                  setIsPokemonSelectorOpen(true);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Pokémon Selector Dialog */}
      <Dialog
        open={isPokemonSelectorOpen}
        onOpenChange={setIsPokemonSelectorOpen}
      >
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Select a Pokémon</DialogTitle>
            <DialogDescription>
              Choose a Pokémon to add to slot {activeSlot ? activeSlot : ''}
            </DialogDescription>
          </DialogHeader>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Loading Pokémon list...
                  </p>
                </div>
              </div>
            }
          >
            <PokemonSelector
              generation={generation.value}
              tier={tier.value}
              onPokemonSelected={onPokemonSelected}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
      {/**/}
      {/* {/* Team Analysis Dialog */}
      {/* <Dialog open={isTeamAnalysisOpen} onOpenChange={setIsTeamAnalysisOpen}> */}
      {/*   <DialogContent className="max-w-4xl"> */}
      {/*     <DialogHeader> */}
      {/*       <DialogTitle>Team Analysis</DialogTitle> */}
      {/*       <DialogDescription> */}
      {/*         Detailed breakdown of your team's strengths and weaknesses */}
      {/*       </DialogDescription> */}
      {/*     </DialogHeader> */}
      {/*     <TeamAnalysis */}
      {/*       team={team.filter((p) => p !== null)} */}
      {/*       typeColors={typeColors} */}
      {/*     /> */}
      {/*   </DialogContent> */}
      {/* </Dialog> */}
      {/* {/* Pokémon Edit Dialog */}
      {activePokemon.value && speciesList[activeSlot - 1] && (
        <Dialog
          open={isPokemonEditorOpen}
          onOpenChange={setIsPokemonEditorOpen}
        >
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader className="flex flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    ...Icons.getPokemon(activePokemon.value.species).css,
                  }}
                />
                <div>
                  <DialogTitle className="text-xl">
                    {activePokemon.value.name || activePokemon.value.species}
                  </DialogTitle>
                  <div className="mt-1 flex gap-1">
                    {speciesList[activeSlot - 1]?.types.map((type: string) => (
                      <Badge
                        key={type}
                        className={`${
                          typeColors[type as TypeName]
                        } text-xs capitalize`}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </DialogHeader>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">
                      Loading editor...
                    </p>
                  </div>
                </div>
              }
            >
              <PokemonEditor
                activePokemon={activePokemon.value}
                species={speciesList[activeSlot - 1] as Species}
                addPokemon={() => onAddPokemonToTeam()}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
