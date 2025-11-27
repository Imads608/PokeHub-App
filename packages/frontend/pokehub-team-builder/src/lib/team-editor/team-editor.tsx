'use client';

import {
  createNewPokemonFromSpecies,
  useTeamEditorContext,
} from '../context/team-editor-context/team-editor.context';
import { TeamValidationProvider } from '../context/team-validation-context/team-validation.provider';
import { arePokemonEqual } from '../hooks/useTeamChanges';
import { EmptySlot } from './empty-slot';
import { PokemonCard } from './pokemon-card';
import { TeamConfigurationSection } from './team-configuration-section';
import type { Species, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { getPokemonDetailsByName } from '@pokehub/frontend/dex-data-provider';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { useCallback, useMemo, useState, Suspense, lazy } from 'react';

// Lazy load dialog components for better performance
// webpackPrefetch tells the browser to prefetch these during idle time
const LazyPokemonSelector = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "pokemon-selection" */
    './pokemon-selector/pokemon-selector'
  ).then((mod) => ({
    default: mod.PokemonSelector,
  }))
);

const LazyPokemonEditor = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "pokemon-selection" */
    './pokemon-editor/pokemon-editor'
  ).then((mod) => ({
    default: mod.PokemonEditor,
  }))
);

const LazyTeamAnalysisDialog = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "team-analysis" */
    './team-analysis'
  ).then((mod) => ({
    default: mod.TeamAnalysisDialog,
  }))
);

export const TeamEditor = () => {
  // State for team configuration

  const { teamPokemon, generation, format, activePokemon, showdownFormatId } =
    useTeamEditorContext();
  const [isTeamAnalysisOpen, setIsTeamAnalysisOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [isPokemonSelectorOpen, setIsPokemonSelectorOpen] = useState(false);
  const [isPokemonEditorOpen, setIsPokemonEditorOpen] = useState(false);
  const [pokemonSnapshot, setPokemonSnapshot] = useState<
    PokemonInTeam | undefined
  >(undefined);
  const [editingNewPokemon, setEditingNewPokemon] = useState(false);

  const onPokemonSelected = useCallback(
    (pokemon: Species | PokemonInTeam, index?: number) => {
      activePokemon.setValue(pokemon);
      setIsPokemonSelectorOpen(false);
      setIsPokemonEditorOpen(true);

      // If index provided, we're editing existing Pokemon
      // Otherwise, we're adding a new Pokemon
      if (index !== undefined) {
        setActiveIndex(index);
        setEditingNewPokemon(false);
      } else {
        setActiveIndex(undefined);
        setEditingNewPokemon(true);
      }

      // Save snapshot for cancel functionality
      if ('exists' in pokemon) {
        // New Pokemon from species - snapshot will be the newly created Pokemon
        setPokemonSnapshot(createNewPokemonFromSpecies(pokemon));
      } else {
        // Editing existing Pokemon - make deep copy for snapshot
        const pokemonInTeam = pokemon as PokemonInTeam;
        setPokemonSnapshot({
          ...pokemonInTeam,
          moves: [...pokemonInTeam.moves],
          evs: { ...pokemonInTeam.evs },
          ivs: { ...pokemonInTeam.ivs },
        });
      }
    },
    [activePokemon]
  );

  const updateStatesOnEditClose = useCallback(() => {
    setIsPokemonEditorOpen(false);
    setPokemonSnapshot(undefined);
    activePokemon.setValue(undefined);
    setActiveIndex(undefined);
    setEditingNewPokemon(false);
  }, [activePokemon]);

  const onAddPokemonToTeam = useCallback(() => {
    if (!activePokemon.value) return;

    if (editingNewPokemon) {
      // Adding new Pokemon to team
      teamPokemon.addActivePokemonToTeam();
    } else if (activeIndex !== undefined) {
      // Updating existing Pokemon
      teamPokemon.updatePokemonInTeam(activeIndex, activePokemon.value);
    }

    updateStatesOnEditClose();
  }, [
    editingNewPokemon,
    activeIndex,
    teamPokemon,
    activePokemon,
    updateStatesOnEditClose,
  ]);

  const onCancelEdit = useCallback(() => {
    // Check if there are unsaved changes
    const hasChanges =
      pokemonSnapshot &&
      activePokemon.value &&
      !arePokemonEqual(pokemonSnapshot, activePokemon.value);

    if (hasChanges) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );

      if (!confirmed) {
        return; // User cancelled, keep dialog open
      }
    }

    // Close without saving changes
    // if (pokemonSnapshot) {
    //   activePokemon.setValue(pokemonSnapshot);
    // }
    updateStatesOnEditClose();
  }, [pokemonSnapshot, activePokemon, updateStatesOnEditClose]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // User is trying to close - use cancel logic
        onCancelEdit();
      } else {
        setIsPokemonEditorOpen(true);
      }
    },
    [onCancelEdit]
  );

  // Get species for active Pokemon
  const activeSpecies = useMemo(() => {
    if (!activePokemon.value) return null;
    return getPokemonDetailsByName(
      activePokemon.value.species,
      generation.value
    );
  }, [activePokemon.value, generation.value]);

  return (
    <TeamValidationProvider>
      {/* Team Configuration */}
      <TeamConfigurationSection
        onOpenTeamAnalysis={() => setIsTeamAnalysisOpen(true)}
      />

      {/* Team Builder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamPokemon.value.map((pokemon, index) => (
          <div key={index}>
            <PokemonCard
              isPokemonEditorOpen
              pokemon={pokemon}
              generation={generation.value}
              onRemove={() => teamPokemon.removePokemonFromTeam(index)}
              onEdit={() => onPokemonSelected(pokemon, index)}
              index={index}
            />
          </div>
        ))}
        {/* Show "Add Pokemon" button when team has less than 6 */}
        {teamPokemon.value.length < 6 && (
          <div>
            <EmptySlot
              index={teamPokemon.value.length}
              onClick={() => {
                setIsPokemonSelectorOpen(true);
              }}
            />
          </div>
        )}
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
              Choose a Pokémon to add to your team
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
            <LazyPokemonSelector
              generation={generation.value}
              format={format.value}
              showdownFormatId={showdownFormatId}
              onPokemonSelected={onPokemonSelected}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Team Analysis Dialog */}
      <Suspense fallback={null}>
        <LazyTeamAnalysisDialog
          open={isTeamAnalysisOpen}
          onOpenChange={setIsTeamAnalysisOpen}
          team={teamPokemon.value}
          generation={generation.value}
        />
      </Suspense>

      {/* Pokémon Edit Dialog */}
      {activePokemon.value && activeSpecies && (
        <Dialog
          open={isPokemonEditorOpen}
          onOpenChange={handleDialogOpenChange}
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
                    {activeSpecies.types.map((type: string) => (
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
              <LazyPokemonEditor
                activePokemon={activePokemon.value}
                species={activeSpecies}
                addPokemon={() => onAddPokemonToTeam()}
                onCancel={onCancelEdit}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </TeamValidationProvider>
  );
};
