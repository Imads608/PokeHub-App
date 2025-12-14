'use client';

import { useTeamViewerFilters } from '../context/team-viewer.context';
import type { PokemonTeam } from '@pokehub/shared/pokemon-types';
import { useMemo } from 'react';

/**
 * Hook to filter and sort teams based on current filter state
 * Client-side filtering is efficient for expected team counts (<100 teams per user)
 */
export function useFilteredTeams(teams: PokemonTeam[] | undefined) {
  const { searchTerm, selectedGeneration, selectedFormat, sortBy, sortOrder } =
    useTeamViewerFilters();

  return useMemo(() => {
    if (!teams) return [];

    let filtered = [...teams];

    // Filter by search term (case-insensitive, team name only)
    if (searchTerm.value) {
      const searchLower = searchTerm.value.toLowerCase();
      filtered = filtered.filter((team) =>
        team.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by generation
    if (selectedGeneration.value !== 'all') {
      filtered = filtered.filter(
        (team) => team.generation === selectedGeneration.value
      );
    }

    // Filter by format
    if (selectedFormat.value !== 'all') {
      filtered = filtered.filter(
        (team) => team.format === selectedFormat.value
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy.value) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created': {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
        case 'updated': {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
      }

      return sortOrder.value === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    teams,
    searchTerm.value,
    selectedGeneration.value,
    selectedFormat.value,
    sortBy.value,
    sortOrder.value,
  ]);
}
