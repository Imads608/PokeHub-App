'use client';

import { DexSearchFiltersContext } from './dex-search.context';
import { TypeName, GenerationNum } from '@pkmn/dex';
import { useState } from 'react';

export const DexSearchProvider = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  const [typeFilter, setTypeFilter] = useState<TypeName[] | undefined>(
    undefined
  );
  const [genFilter, setGenFilter] = useState<GenerationNum[] | undefined>(
    undefined
  );
  const [searchTermVal, setSearchTerm] = useState<string | undefined>(
    undefined
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<
    'id' | 'name' | 'hp' | 'attack' | 'defense'
  >('id');

  return (
    <DexSearchFiltersContext.Provider
      value={{
        types: {
          value: typeFilter,
          setValue: setTypeFilter,
        },
        generations: {
          value: genFilter,
          setValue: setGenFilter,
        },
        searchTerm: {
          value: searchTermVal,
          setValue: setSearchTerm,
        },
        sortOrder: {
          value: sortOrder,
          setValue: setSortOrder,
        },
        sortBy: {
          value: sortBy,
          setValue: setSortBy,
        },
      }}
    >
      {children}
    </DexSearchFiltersContext.Provider>
  );
};

DexSearchProvider.displayName = 'DexSearchProvider';
