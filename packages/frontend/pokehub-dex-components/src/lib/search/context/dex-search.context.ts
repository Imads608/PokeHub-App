import type { DexSearchFilters } from './dex-search.context.model';
import type { GenerationNum, TypeName } from '@pkmn/dex';
import { createContext, useContext } from 'react';

export const DexSearchFiltersContext = createContext<
  DexSearchFilters<'ReadWrite'>
>({
  types: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
  generations: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
  searchTerm: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
  sortOrder: {
    value: 'asc',
    setValue: () => {
      // Function needs to be set
    },
  },
  sortBy: {
    value: 'name',
    setValue: () => {
      // Function needs to be set
    },
  },
});

export const useDexSearchFilters = () => {
  const { types, generations, searchTerm, sortBy, sortOrder } = useContext<
    DexSearchFilters<'ReadWrite'>
  >(DexSearchFiltersContext);

  const toggleType = (type: TypeName) => {
    if (types.value?.includes(type)) {
      types.setValue(types.value.filter((t) => t !== type));
    } else {
      types.setValue([...(types.value ?? []), type]);
    }
  };

  const toggleGen = (gen: GenerationNum) => {
    if (generations.value?.includes(gen)) {
      generations.setValue(generations.value.filter((g) => g !== gen));
    } else {
      generations.setValue([...(generations.value ?? []), gen]);
    }
  };

  const toggleSortOrder = () => {
    sortOrder.setValue(sortOrder.value === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    types.setValue(undefined);
    generations.setValue(undefined);
    searchTerm.setValue(undefined);
    sortBy.setValue('name');
    sortOrder.setValue('asc');
  };

  return {
    types: { value: types.value, toggleType, setTypes: types.setValue },
    generations: {
      value: generations.value,
      toggleGen,
      setGenerations: generations.setValue,
    },
    searchTerm,
    sortBy,
    sortOrder: { value: sortOrder.value, toggleSortOrder },
    resetFilters,
  };
};
