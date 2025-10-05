'use client';

import { useDexSearchFilters } from './context/dex-search.context';
import { DesktopFilterContainer } from './filters/desktop-filter-container';
import { MobileFilterContainer } from './filters/mobile-filter';
import { usePokedexSearch } from './hooks/usePokedexSearch';
import { SearchResults } from './results/search-results';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@pokehub/frontend/shared-ui-components';
import {
  ArrowUpDown,
  ChevronDown,
  Filter,
  Grid3X3,
  List,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export const DexSearchContainer = () => {
  const {
    searchTerm,
    types: typesFilter,
    generations: generationsFilter,
    sortBy,
    sortOrder,
    resetFilters,
  } = useDexSearchFilters();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [debouncedQuery, setDebouncedQuery] = useState(searchTerm.value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm.value);
    }, 300); // Adjust debounce delay as needed

    return () => clearTimeout(handler);
  }, [searchTerm.value]);

  const { data, isLoading } = usePokedexSearch({
    generations: generationsFilter.value || [],
    types: typesFilter.value || [],
    searchTerm: debouncedQuery || '',
  });

  const sortedData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.sort((first, second) => {
      if (sortBy.value === 'id') {
        return sortOrder.value === 'asc'
          ? first.num - second.num
          : second.num - first.num;
      } else if (sortBy.value === 'name') {
        return sortOrder.value === 'asc'
          ? first.name.localeCompare(second.name)
          : second.name.localeCompare(first.name);
      } else if (sortBy.value === 'hp') {
        return sortOrder.value === 'asc'
          ? first.baseStats.hp - second.baseStats.hp
          : second.baseStats.hp - first.baseStats.hp;
      } else if (sortBy.value === 'attack') {
        return sortOrder.value === 'asc'
          ? first.baseStats.atk - second.baseStats.atk
          : second.baseStats.atk - first.baseStats.atk;
      } else {
        return sortOrder.value === 'asc'
          ? first.baseStats.def - second.baseStats.def
          : second.baseStats.def - first.baseStats.def;
      }
    });
  }, [data, sortBy.value, sortOrder.value]);

  return (
    <>
      <DesktopFilterContainer />

      {/* Main content area */}
      <div>
        {/* Search and controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or number..."
              onChange={(e) => searchTerm.setValue(e.target.value)}
              value={searchTerm.value || ''}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
                onClick={() => searchTerm.setValue('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter button */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {(typesFilter.value?.length ||
                generationsFilter.value?.length) && (
                <Badge className="ml-2 bg-primary text-primary-foreground">
                  {(typesFilter.value?.length || 0) +
                    (generationsFilter.value?.length || 0)}
                </Badge>
              )}
            </Button>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sort
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => sortBy.setValue('id')}>
                  Number{' '}
                  {sortBy.value === 'id' &&
                    (sortOrder.value === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sortBy.setValue('name')}>
                  Name{' '}
                  {sortBy.value === 'name' &&
                    (sortOrder.value === 'asc' ? 'A-Z' : 'Z-A')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => sortBy.setValue('hp')}>
                  HP{' '}
                  {sortBy.value === 'hp' &&
                    (sortOrder.value === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sortBy.setValue('attack')}>
                  Attack{' '}
                  {sortBy.value === 'attack' &&
                    (sortOrder.value === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sortBy.setValue('defense')}>
                  Defense{' '}
                  {sortBy.value === 'defense' &&
                    (sortOrder.value === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={sortOrder.toggleSortOrder}>
                  Order:{' '}
                  {sortOrder.value === 'asc' ? 'Ascending' : 'Descending'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* View mode toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none border-r"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile filters (collapsible) */}
        {isMobileFilterOpen && <MobileFilterContainer />}

        <SearchResults
          results={sortedData}
          resetFilters={resetFilters}
          viewMode={viewMode}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};
