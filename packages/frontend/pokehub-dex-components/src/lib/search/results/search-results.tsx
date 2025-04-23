import { Species } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import {
  Badge,
  Button,
  Card,
  CardContent,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface SearchResultsProps {
  results: Species[];
  viewMode: 'grid' | 'list';
  resetFilters: () => void;
  isLoading?: boolean;
}

export const SearchResults = (props: SearchResultsProps) => {
  const { results, viewMode, resetFilters, isLoading } = props;
  const [itemsToShow, setItemsToShow] = useState(100); // Initial number of items to display
  const itemsPerPage = 20; // Number of items to load per scroll

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100 // Trigger 100px before the bottom
    ) {
      setItemsToShow((prev) => prev + itemsPerPage);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const paginatedData = results.slice(0, itemsToShow);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <div className="mb-4 rounded-full bg-muted p-3">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-medium">Loading Pokémon...</h3>
        <p className="text-center text-muted-foreground">
          Please wait while we fetch the Pokémon data.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Results count */}
      {paginatedData?.length && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {results.length} Pokémon
          </p>
        </div>
      )}

      {/* Pokemon grid/list */}
      {paginatedData.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {paginatedData.map((pokemon) => {
              const icon = Icons.getPokemon(pokemon.name);
              return (
                <Link href={`/pokedex/${pokemon.id}`} key={pokemon.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <div className="bg-muted/50 p-4">
                      <div className="flex justify-between">
                        <div className="flex gap-1">
                          {pokemon.types.map((type) => (
                            <Badge
                              key={type}
                              className={`${
                                typeColors[type as keyof typeof typeColors]
                              } capitalize`}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-center py-2">
                        <span
                          style={{
                            ...icon.css,
                          }}
                        />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <span className="text-xs font-semibold text-muted-foreground">
                        #{pokemon.num.toString().padStart(3, '0')}
                      </span>
                      <h3 className="font-semibold">{pokemon.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedData.map((pokemon) => {
              const icon = Icons.getPokemon(pokemon.name);
              return (
                <Link href={`/pokedex/${pokemon.id}`} key={pokemon.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center p-3">
                      <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                        <span
                          style={{
                            ...icon.css,
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            #{pokemon.num.toString().padStart(3, '0')}
                          </span>
                          <h3 className="font-semibold">{pokemon.name}</h3>
                        </div>
                        <div className="mt-1 flex gap-1">
                          {pokemon.types.map((type) => (
                            <Badge
                              key={type}
                              className={`${
                                typeColors[type as keyof typeof typeColors]
                              } capitalize`}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">HP</p>
                          <p className="font-medium">{pokemon.baseStats.hp}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">ATK</p>
                          <p className="font-medium">{pokemon.baseStats.atk}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">DEF</p>
                          <p className="font-medium">{pokemon.baseStats.def}</p>
                        </div>
                        <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-medium">No Pokémon Found</h3>
          <p className="text-center text-muted-foreground">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      )}
      {/* Optional: Loading indicator */}
      {itemsToShow < results.length && (
        <p className="text-center text-muted-foreground">Loading more...</p>
      )}
    </>
  );
};
