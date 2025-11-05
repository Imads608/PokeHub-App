'use client';

import { useTeamEditorContext } from '../context/team-editor.context';
import { EmptySlot } from './empty-slot';
import { PokemonCard } from './pokemon-card';
import { PokemonEditor } from './pokemon-editor';
import { PokemonSelector } from './pokemon-selector';
import { TeamConfigurationSection } from './team-configuration-section';
import type { Species, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
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

  const { teamPokemon, generation, tier } = useTeamEditorContext();
  //const [, setIsTeamAnalysisOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | undefined>(1);
  const [isPokemonSelectorOpen, setIsPokemonSelectorOpen] = useState(false);
  const [isPokemonEditorOpen, setIsPokemonEditorOpen] = useState(false);
  const [activePokemon, setActivePokemon] = useState<
    { species: Species; pokemon?: Partial<PokemonInTeam> } | undefined
  >(undefined);

  const onPokemonSelected = useCallback(
    (species: Species, pokemon?: Partial<PokemonInTeam>) => {
      setActivePokemon({ species, pokemon });
      setIsPokemonSelectorOpen(false);
      setIsPokemonEditorOpen(true);
    },
    []
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
                speciesName={pokemon.species}
                pokemon={pokemon}
                generation={generation.value}
                onRemove={() => console.log('implement')}
                onUpdate={(updates) => console.log('implement')}
                onEdit={() => {
                  console.log('implement');
                }}
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
      {activePokemon && (
        <Dialog
          open={isPokemonEditorOpen}
          onOpenChange={setIsPokemonEditorOpen}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader className="flex flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    ...Icons.getPokemon(activePokemon.species.name).css,
                  }}
                />
                <div>
                  <DialogTitle className="text-xl">
                    {activePokemon.pokemon?.name || activePokemon.species.name}
                  </DialogTitle>
                  <div className="mt-1 flex gap-1">
                    {activePokemon.species.types.map((type: string) => (
                      <Badge
                        key={type}
                        className={`${
                          typeColors[type as TypeName]
                        } text-xs capitalize`}
                      >
                        {type}
                      </Badge>
                    ))}
                    /
                  </div>
                  /
                </div>
              </div>
            </DialogHeader>
            <PokemonEditor activeSpecies={activePokemon.species} />
            {/* <PokemonEditor */}
            {/*   pokemon={activePokemon.species} */}
            {/*   onUpdate={(updates) => updatePokemon(activePokemonIndex, updates)} */}
            {/*   onClose={() => setIsEditingPokemon(false)} */}
            {/*   typeColors={typeColors} */}
            {/* /> */}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
