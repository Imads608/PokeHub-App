'use client';

import { TeamEditorContext } from './team-editor.context';
import type { GenerationNum, Tier } from '@pkmn/dex';
import type {
  BattleFormat,
  PokemonInTeam,
  PokemonTeam,
} from '@pokehub/shared/pokemon-types';
import { useState } from 'react';

export interface TeamEditorProviderProps {
  team?: PokemonTeam<'Singles' | 'Doubles'>;
  children: React.ReactNode;
}

export const TeamEditorProvider = ({
  team,
  children,
}: TeamEditorProviderProps) => {
  // State for team configuration
  const [teamName, setTeamName] = useState(team?.name);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationNum>(
    team?.generation || 9
  );
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat>(
    team?.format || 'Singles'
  );
  const [selectedTier, setSelectedTier] = useState<Tier.Singles | Tier.Doubles>(
    team?.tier || 'AG'
  );
  const [pokemonTeam, setPokemonTeam] = useState<PokemonInTeam[]>(
    team?.pokemon || []
  );

  const [activePokemon, setActivePokemon] = useState<PokemonInTeam | undefined>(
    undefined
  );

  return (
    <TeamEditorContext.Provider
      value={{
        format: {
          value: selectedFormat,
          setValue: setSelectedFormat,
        },
        tier: {
          value: selectedTier,
          setValue: setSelectedTier,
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
        showdownFormatId: 'gen9anythinggoes',
      }}
    >
      {children}
    </TeamEditorContext.Provider>
  );
};
