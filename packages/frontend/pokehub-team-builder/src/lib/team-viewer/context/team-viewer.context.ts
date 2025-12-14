'use client';

import type { TeamViewerFilters } from './team-viewer.context.model';
import { createContext, useContext } from 'react';

export const TeamViewerFiltersContext = createContext<
  TeamViewerFilters<'ReadWrite'>
>({
  searchTerm: {
    value: '',
    setValue: () => {
      // Function needs to be set
    },
  },
  selectedGeneration: {
    value: 'all',
    setValue: () => {
      // Function needs to be set
    },
  },
  selectedFormat: {
    value: 'all',
    setValue: () => {
      // Function needs to be set
    },
  },
  sortBy: {
    value: 'updated',
    setValue: () => {
      // Function needs to be set
    },
  },
  sortOrder: {
    value: 'desc',
    setValue: () => {
      // Function needs to be set
    },
  },
  viewMode: {
    value: 'grid',
    setValue: () => {
      // Function needs to be set
    },
  },
});

export const useTeamViewerFilters = () => {
  const {
    searchTerm,
    selectedGeneration,
    selectedFormat,
    sortBy,
    sortOrder,
    viewMode,
  } = useContext<TeamViewerFilters<'ReadWrite'>>(TeamViewerFiltersContext);

  const toggleSortOrder = () => {
    sortOrder.setValue(sortOrder.value === 'asc' ? 'desc' : 'asc');
  };

  const toggleViewMode = () => {
    viewMode.setValue(viewMode.value === 'grid' ? 'list' : 'grid');
  };

  const resetFilters = () => {
    searchTerm.setValue('');
    selectedGeneration.setValue('all');
    selectedFormat.setValue('all');
    sortBy.setValue('updated');
    sortOrder.setValue('desc');
  };

  const hasActiveFilters =
    searchTerm.value !== '' ||
    selectedGeneration.value !== 'all' ||
    selectedFormat.value !== 'all';

  return {
    searchTerm,
    selectedGeneration,
    selectedFormat,
    sortBy,
    sortOrder: { ...sortOrder, toggleSortOrder },
    viewMode: { ...viewMode, toggleViewMode },
    resetFilters,
    hasActiveFilters,
  };
};
