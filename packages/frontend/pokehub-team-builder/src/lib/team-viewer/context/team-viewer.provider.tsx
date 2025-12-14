'use client';

import { TeamViewerFiltersContext } from './team-viewer.context';
import type {
  TeamSortBy,
  SortOrder,
  ViewMode,
} from './team-viewer.context.model';
import type { GenerationNum } from '@pkmn/dex';
import { useState } from 'react';

export interface TeamViewerProviderProps {
  children: React.ReactNode;
}

export const TeamViewerProvider = ({ children }: TeamViewerProviderProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGeneration, setSelectedGeneration] = useState<
    GenerationNum | 'all'
  >('all');
  const [selectedFormat, setSelectedFormat] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<TeamSortBy>('updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  return (
    <TeamViewerFiltersContext.Provider
      value={{
        searchTerm: { value: searchTerm, setValue: setSearchTerm },
        selectedGeneration: {
          value: selectedGeneration,
          setValue: setSelectedGeneration,
        },
        selectedFormat: {
          value: selectedFormat,
          setValue: setSelectedFormat,
        },
        sortBy: { value: sortBy, setValue: setSortBy },
        sortOrder: { value: sortOrder, setValue: setSortOrder },
        viewMode: { value: viewMode, setValue: setViewMode },
      }}
    >
      {children}
    </TeamViewerFiltersContext.Provider>
  );
};

TeamViewerProvider.displayName = 'TeamViewerProvider';
