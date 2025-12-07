'use client';

import { TeamEditorContext } from './team-editor.context';
import type { GenerationNum } from '@pkmn/dex';
import type { PokemonInTeam, PokemonTeam } from '@pokehub/shared/pokemon-types';
import { useMemo, useState } from 'react';

export interface TeamEditorProviderProps {
  team?: PokemonTeam;
  children: React.ReactNode;
}

export const TeamEditorProvider = ({
  team,
  children,
}: TeamEditorProviderProps) => {
  // State for team configuration
  const [teamName, setTeamName] = useState(team?.name || '');
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationNum>(
    team?.generation || 9
  );
  const [selectedFormat, setSelectedFormat] = useState<string>(
    team?.format || 'ou'
  );
  const [pokemonTeam, setPokemonTeam] = useState<PokemonInTeam[]>(
    team?.pokemon || []
  );

  const [activePokemon, setActivePokemon] = useState<PokemonInTeam | undefined>(
    undefined
  );

  // Compute Showdown format ID from generation + format
  const showdownFormatId = useMemo(() => {
    return `gen${selectedGeneration}${selectedFormat}`;
  }, [selectedGeneration, selectedFormat]);

  return (
    <TeamEditorContext.Provider
      value={{
        format: {
          value: selectedFormat,
          setValue: setSelectedFormat,
        },
        generation: {
          value: selectedGeneration,
          setValue: setSelectedGeneration,
        },
        teamName: {
          value: teamName,
          setValue: setTeamName,
        },
        teamPokemon: {
          value: pokemonTeam,
          setValue: setPokemonTeam,
        },
        activePokemon: {
          value: activePokemon,
          setValue: setActivePokemon,
        },
        showdownFormatId,
      }}
    >
      {children}
    </TeamEditorContext.Provider>
  );
};
