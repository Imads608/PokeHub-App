'use client';

import { Icons } from '@pkmn/img';
import { getFormatDisplayName } from '@pokehub/frontend/dex-data-provider';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import type { PokemonTeam } from '@pokehub/shared/pokemon-types';
import { CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

interface TeamSelectorProps {
  teams: PokemonTeam[];
  selectedTeamId: string;
  onTeamSelect: (teamId: string) => void;
  disabled?: boolean;
}

interface GroupedTeams {
  label: string;
  generation: number;
  format: string;
  teams: PokemonTeam[];
}

export function TeamSelector({
  teams,
  selectedTeamId,
  onTeamSelect,
  disabled,
}: TeamSelectorProps) {
  // Group teams by generation + format
  const groups = useMemo(() => {
    const map = new Map<string, GroupedTeams>();
    for (const team of teams) {
      const key = `gen${team.generation}-${team.format}`;
      if (!map.has(key)) {
        map.set(key, {
          label: getFormatDisplayName(team.generation, team.format),
          generation: team.generation,
          format: team.format,
          teams: [],
        });
      }
      map.get(key)!.teams.push(team);
    }
    // Sort by generation descending, then format name
    return Array.from(map.values()).sort(
      (a, b) =>
        b.generation - a.generation || a.format.localeCompare(b.format)
    );
  }, [teams]);

  if (!teams.length) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No teams found. Create a team in the Team Builder first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={`gen${group.generation}-${group.format}`}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.teams.map((team) => {
              const isSelected = team.id === selectedTeamId;
              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => team.id && onTeamSelect(team.id)}
                  className={`w-full text-left transition-all rounded-lg border p-3 ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {team.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>

                      {/* Pokemon sprite row */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {team.pokemon.map((pokemon, index) => {
                          const icon = Icons.getPokemon(pokemon.species);
                          return (
                            <div
                              key={index}
                              className="flex h-8 items-center justify-center"
                              title={pokemon.species}
                            >
                              <span style={{ ...icon.css }} />
                            </div>
                          );
                        })}
                        {/* Empty slots */}
                        {Array.from({
                          length: 6 - team.pokemon.length,
                        }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="flex h-8 w-10 items-center justify-center rounded border border-dashed border-muted-foreground/25"
                          >
                            <span className="text-xs text-muted-foreground/40">
                              ?
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs shrink-0">
                      {team.pokemon.length}/6
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
