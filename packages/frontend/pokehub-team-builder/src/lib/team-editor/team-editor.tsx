'use client';

import { useTeamEditorContext } from '../context/team-editor.context';
import { EmptySlot } from './empty-slot';
import { PokemonCard } from './pokemon-card';
import { PokemonEditor } from './pokemon-editor/pokemon-editor';
import { PokemonSelector } from './pokemon-selector/pokemon-selector';
import { TeamConfigurationSection } from './team-configuration-section';
import type { Species, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { getPokemonDetailsByName } from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { useCallback, useState } from 'react';

export const TeamEditor = () => {
  // State for team configuration

  const { teamPokemon, generation, tier, activePokemon } =
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
                pokemon={pokemon}
                generation={generation.value}
                onRemove={() => console.log('implement')}
                onEdit={() => onPokemonSelected(pokemon, index + 1)}
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

      {/* {/* Success Message */}
      {/* {showSuccessMessage && ( */}
      {/*   <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5"> */}
      {/*     <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300"> */}
      {/*       <Sparkles className="h-4 w-4" /> */}
      {/*       <AlertTitle>Success!</AlertTitle> */}
      {/*       <AlertDescription> */}
      {/*         {teamName} has been saved successfully. */}
      {/*       </AlertDescription> */}
      {/*     </Alert> */}
      {/*   </div> */}
      {/* )} */}
      {/**/}
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
          <PokemonSelector
            generation={generation.value}
            tier={tier.value}
            onPokemonSelected={onPokemonSelected}
          />
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
            <PokemonEditor
              activePokemon={activePokemon.value}
              species={speciesList[activeSlot - 1] as Species}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
