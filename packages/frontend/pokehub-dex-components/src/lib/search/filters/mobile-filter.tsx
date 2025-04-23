'use client';

import { useDexSearchFilters } from '../context/dex-search.context';
import { GenerationNum, TypeName } from '@pkmn/dex';
import {
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';

export const MobileFilterContainer = () => {
  const {
    types: typesFilter,
    generations: generationsFilter,
    resetFilters,
  } = useDexSearchFilters();

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm lg:hidden">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 text-xs"
        >
          Reset All
        </Button>
      </div>

      <Tabs defaultValue="types">
        <TabsList className="w-full">
          <TabsTrigger value="types" className="flex-1">
            Types
          </TabsTrigger>
          <TabsTrigger value="generations" className="flex-1">
            Generations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeColors).map(
              ([type, colorClass]) =>
                type !== 'Stellar' &&
                type !== '???' && (
                  <Badge
                    key={type}
                    className={`cursor-pointer capitalize ${
                      typesFilter.value?.includes(type as TypeName)
                        ? colorClass
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => typesFilter.toggleType(type as TypeName)}
                  >
                    {type}
                  </Badge>
                )
            )}
          </div>
        </TabsContent>

        <TabsContent value="generations" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GenerationNum[]).map((gen) => (
              <Badge
                key={gen}
                className={`cursor-pointer ${
                  generationsFilter.value?.includes(gen)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => generationsFilter.toggleGen(gen)}
              >
                Gen {gen}
              </Badge>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
