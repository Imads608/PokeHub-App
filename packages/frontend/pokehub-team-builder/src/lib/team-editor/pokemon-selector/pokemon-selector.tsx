import { useFilterPokemonList } from '../../hooks/useFilterPokemonList';
import { useBannedAndIllegalPokemon } from '../../hooks/useFormatBans';
import { PokemonCardSkeleton } from './pokemon-card-skeleton';
import type { GenerationNum, Species, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { getAllPokemonSpecies } from '@pokehub/frontend/dex-data-provider';
import {
  Badge,
  Button,
  Input,
  ScrollArea,
  ScrollBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import {
  typeColors,
  useDebouncedSearch,
  useInfiniteScroll,
} from '@pokehub/frontend/shared-utils';
import { Filter, Search, X } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';

interface TypeBadgesProps {
  className?: string;
  selectedTypes: TypeName[];
  activeTab: string;
  onTypeToggle: (type: TypeName) => void;
}

const TypeBadges = memo(function TypeBadges({
  className,
  selectedTypes,
  activeTab,
  onTypeToggle,
}: TypeBadgesProps) {
  return (
    <>
      {Object.keys(typeColors).map(
        (type: string) =>
          type !== 'Stellar' &&
          type !== '???' && (
            <Badge
              key={type}
              className={`cursor-pointer capitalize ${
                selectedTypes.includes(type as TypeName) || activeTab === type
                  ? typeColors[type as TypeName]
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${className || ''}`}
              onClick={() => onTypeToggle(type as TypeName)}
            >
              {type}
            </Badge>
          )
      )}
    </>
  );
});

export interface PokemonSelectorProps {
  generation: GenerationNum;
  format: string;
  showdownFormatId: string;
  onPokemonSelected: (val: Species) => void;
}

export const PokemonSelector = ({
  generation,
  format,
  showdownFormatId,
  onPokemonSelected,
}: PokemonSelectorProps) => {
  // Determine if this is a doubles format
  const isDoubles = format.includes('doubles') || format.includes('vgc');

  const [unfilteredResults] = useState(() => getAllPokemonSpecies(generation));

  const { debouncedSearchTerm, searchTerm, setSearchTerm } = useDebouncedSearch(
    { initialVal: '' }
  );
  const [selectedTypes, setSelectedTypes] = useState<TypeName[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const { itemsToShow, handleScroll, resetItems } = useInfiniteScroll({});

  // Filter out banned and illegal Pokemon
  const { data: filteredResults, isLoading: isBansLoading } =
    useBannedAndIllegalPokemon(
      unfilteredResults,
      showdownFormatId,
      generation,
      isDoubles
    );

  const { isLoading, data } = useFilterPokemonList(filteredResults, {
    generation,
    format,
    types: selectedTypes,
    searchTerm: debouncedSearchTerm,
    enabled: !isBansLoading && filteredResults.length > 0,
  });

  // Combined loading state
  const isDataLoading = isLoading || isBansLoading;

  const handleTypeToggle = useCallback((type: TypeName) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setActiveTab('all');
    resetItems();
  };

  // Reset pagination when filters change
  useEffect(() => {
    resetItems();
  }, [debouncedSearchTerm, selectedTypes, activeTab]);

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden">
      {/* Search and filters */}
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="pokemon-search-input"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* Mobile filter toggle */}
          <Button
            variant={isMobileFilterOpen ? 'secondary' : 'outline'}
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            aria-label={
              isMobileFilterOpen ? 'Hide type filters' : 'Show type filters'
            }
            aria-expanded={isMobileFilterOpen}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop type badges - hidden on mobile */}
        <div className="hidden flex-wrap gap-2 lg:flex">
          <TypeBadges
            selectedTypes={selectedTypes}
            activeTab={activeTab}
            onTypeToggle={handleTypeToggle}
          />

          {(searchTerm || selectedTypes.length > 0 || activeTab !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Mobile type badges - collapsible horizontal scroll */}
        {isMobileFilterOpen && (
          <div className="lg:hidden">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max gap-2 p-1">
                <TypeBadges
                  className="shrink-0"
                  selectedTypes={selectedTypes}
                  activeTab={activeTab}
                  onTypeToggle={handleTypeToggle}
                />
                {(searchTerm ||
                  selectedTypes.length > 0 ||
                  activeTab !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Tabs for type filtering - hidden on mobile */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mb-4 hidden h-auto flex-wrap lg:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          {Object.keys(typeColors).map(
            (type) =>
              type !== 'Stellar' &&
              type !== '???' && (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type}
                </TabsTrigger>
              )
          )}
        </TabsList>

        <TabsContent
          value={activeTab}
          className="mt-0 flex min-h-0 flex-1 flex-col"
        >
          {/* Results count */}
          {data && data.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(itemsToShow, data.length)} of {data.length}{' '}
                Pokémon
              </p>
            </div>
          )}

          <ScrollArea
            className="min-h-0 flex-1 lg:h-[calc(70vh-220px)]"
            onScrollCapture={handleScroll}
          >
            <div className="grid grid-cols-2 gap-2 pr-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {isDataLoading
                ? // Loading skeleton cards
                  Array.from({ length: 20 }).map((_, index) => (
                    <PokemonCardSkeleton key={`skeleton-${index}`} />
                  ))
                : data?.slice(0, itemsToShow).map((pokemon) => {
                    const pokemonTier = pokemon.tier;
                    return (
                      <div
                        key={pokemon.id}
                        className="flex cursor-pointer flex-col items-center rounded-lg border p-2 transition-colors hover:bg-muted"
                        onClick={() => onPokemonSelected(pokemon)}
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>#{pokemon.num}</span>
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold"
                          >
                            {pokemonTier}
                          </Badge>
                        </div>
                        <span
                          style={{
                            ...Icons.getPokemon(pokemon.name).css,
                          }}
                        />
                        <div className="mt-2 text-sm font-medium">
                          {pokemon.name}
                        </div>
                        <div className="mt-1 flex gap-1">
                          {pokemon.types.map((type: string) => (
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
                    );
                  })}

              {!isDataLoading && data?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="mb-4 rounded-full bg-muted p-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium">No Pokémon Found</h3>
                  <p className="text-center text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Loading indicator */}
            {data && itemsToShow < data.length && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Scroll to load more...
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
