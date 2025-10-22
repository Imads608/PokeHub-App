import { useFilterPokemonList } from '../hooks/useFilterPokemonList';
import { PokemonCardSkeleton } from './pokemon-card-skeleton';
import type { GenerationNum, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { getPokemonCompetitive } from '@pokehub/frontend/dex-data-provider';
import type { BattleTier } from '@pokehub/frontend/pokemon-types';
import {
  Badge,
  Button,
  Input,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface PokemonSelectorProps {
  generation: GenerationNum;
  tier: BattleTier<'Singles' | 'Doubles'>;
}

export const PokemonSelector = ({ generation, tier }: PokemonSelectorProps) => {
  const [unfilteredResults] = useState(() =>
    getPokemonCompetitive(generation, tier)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<TypeName[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [itemsToShow, setItemsToShow] = useState(50); // Initial number of items to display
  const itemsPerPage = 20; // Number of items to load per scroll

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { isLoading, data } = useFilterPokemonList(unfilteredResults, {
    generation,
    tier,
    types: selectedTypes,
    searchTerm: debouncedSearchTerm,
  });

  const handleTypeToggle = (type: TypeName) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setActiveTab('all');
    setItemsToShow(50);
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (
      target.scrollHeight - target.scrollTop <=
      target.clientHeight + 100 // Trigger 100px before bottom
    ) {
      setItemsToShow((prev) => prev + itemsPerPage);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setItemsToShow(50);
  }, [debouncedSearchTerm, selectedTypes, activeTab]);

  return (
    <div className="flex h-[70vh] flex-col">
      {/* Search and filters */}
      <div className="mb-4 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
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

        <div className="flex flex-wrap gap-2">
          {Object.keys(typeColors).map(
            (type: string) =>
              type !== 'Stellar' &&
              type !== '???' && (
                <Badge
                  key={type}
                  className={`cursor-pointer capitalize ${
                    selectedTypes.includes(type as TypeName) ||
                    activeTab === type
                      ? typeColors[type as TypeName]
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => handleTypeToggle(type as TypeName)}
                >
                  {type}
                </Badge>
              )
          )}

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
      </div>

      {/* Tabs for type filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="mb-4 flex h-auto flex-wrap">
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

        <TabsContent value={activeTab} className="mt-0 flex-1">
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
            className="h-[calc(70vh-220px)]"
            onScrollCapture={handleScroll}
          >
            <div className="grid grid-cols-2 gap-2 pr-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {isLoading
                ? // Loading skeleton cards
                  Array.from({ length: 20 }).map((_, index) => (
                    <PokemonCardSkeleton key={`skeleton-${index}`} />
                  ))
                : data?.slice(0, itemsToShow).map((pokemon) => (
                    <div
                      key={pokemon.id}
                      className="flex cursor-pointer flex-col items-center rounded-lg border p-2 transition-colors hover:bg-muted"
                      onClick={() => console.log('Implement')}
                    >
                      <div className="mb-2 text-xs text-muted-foreground">
                        #{pokemon.id}
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
                  ))}

              {!isLoading && data?.length === 0 && (
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
