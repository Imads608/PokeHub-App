import { useTeamEditorContext } from '../../context/team-editor.context';
import type { AbilityName, ItemName, NatureName, Species } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import {
  getItems,
  getNatures,
  getPokemonAbilitiesDetailsFromSpecies,
} from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  TabsContent,
} from '@pokehub/frontend/shared-ui-components';
import {
  useDebouncedSearch,
  useInfiniteScroll,
} from '@pokehub/frontend/shared-utils';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface BasicTabProps {
  pokemon: PokemonInTeam;
  species: Species;
}

export const BasicTab = ({ pokemon, species }: BasicTabProps) => {
  const {
    activePokemon: { setLevel, setName, setAbility, setItem, setNature },
    generation,
  } = useTeamEditorContext();

  // Retrieve Data
  const [abilities] = useState(() =>
    getPokemonAbilitiesDetailsFromSpecies(species, generation.value)
  );
  const [natures] = useState(() => getNatures(generation.value));
  const [items] = useState(() => getItems(generation.value));

  // Search States
  const {
    searchTerm: itemSearch,
    setSearchTerm: setItemSearch,
    debouncedSearchTerm: debouncedItemSearch,
  } = useDebouncedSearch({ initialVal: '' });
  const {
    searchTerm: natureSearch,
    setSearchTerm: setNatureSearch,
    debouncedSearchTerm: debouncedNatureSearch,
  } = useDebouncedSearch({ initialVal: '' });

  // Filtered data based on search
  const [filteredItems, setFilteredItems] = useState(items);
  const [filteredNatures, setFilteredNatures] = useState(natures);

  // Popover open states
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isNatureOpen, setIsNatureOpen] = useState(false);

  // Update filtered items when search changes
  useEffect(() => {
    if (!debouncedItemSearch.trim()) {
      setFilteredItems(items);
    } else {
      const searchTerm = debouncedItemSearch.toLowerCase();
      setFilteredItems(
        items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.desc.toLowerCase().includes(searchTerm)
        )
      );
    }
  }, [debouncedItemSearch]);

  // Update filtered natures when search changes
  useEffect(() => {
    if (!debouncedNatureSearch.trim()) {
      setFilteredNatures(natures);
    } else {
      const searchTerm = debouncedNatureSearch.toLowerCase();
      setFilteredNatures(
        natures.filter(
          (nature) =>
            nature.name.toLowerCase().includes(searchTerm) ||
            nature.desc.toLowerCase().includes(searchTerm)
        )
      );
    }
  }, [debouncedNatureSearch]);

  const { itemsToShow, handleScroll: handleItemsScroll } = useInfiniteScroll(
    {}
  );

  return (
    <TabsContent value="basic" className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={pokemon.name}
            onChange={(e) => setName(e.target.value)}
            placeholder={pokemon.species}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="level">Level</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="level"
              value={[pokemon.level]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => setLevel(value[0])}
              className="flex-1"
            />
            <div className="w-12 text-center">{pokemon.level}</div>
          </div>
        </div>

        <div>
          <Label htmlFor="ability">Ability</Label>
          <Select
            value={pokemon.ability}
            onValueChange={(value) => setAbility(value as AbilityName)}
          >
            <SelectTrigger id="ability" className="mt-1">
              <SelectValue placeholder="Select ability" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {abilities.map(
                  (ability) =>
                    ability && (
                      <SelectItem
                        key={ability.id}
                        value={ability.id}
                        className="py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{ability.name}</span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {ability.desc}
                          </span>
                        </div>
                      </SelectItem>
                    )
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="item">Item</Label>
          <Popover modal={true} open={isItemOpen} onOpenChange={setIsItemOpen}>
            <PopoverTrigger asChild>
              <Button
                id="item"
                variant="outline"
                role="combobox"
                aria-expanded={isItemOpen}
                className="mt-1 h-11 w-full justify-between"
              >
                {pokemon.item ? (
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        ...Icons.getItem(pokemon.item).css,
                      }}
                    />
                    <span>{pokemon.item}</span>
                  </div>
                ) : (
                  <span>Select item</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <div className="flex items-center border-b px-3 py-2">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <ScrollArea className="h-[300px]" onScrollCapture={handleItemsScroll}>
                <div className="p-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setItem('' as ItemName);
                      setIsItemOpen(false);
                    }}
                    className="group relative flex h-auto w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-3 text-sm font-normal outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        !pokemon.item ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span className="font-medium group-hover:text-accent-foreground">
                      None
                    </span>
                  </Button>
                  {filteredItems.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No items found.
                    </div>
                  ) : (
                    filteredItems.slice(0, itemsToShow).map((item) => (
                      <Button
                        key={item.name}
                        variant="ghost"
                        onClick={() => {
                          setItem(item.name as ItemName);
                          setIsItemOpen(false);
                        }}
                        className="group relative flex h-auto w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-3 text-sm font-normal outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 shrink-0 ${
                            pokemon.item === item.name
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                        <div className="flex w-full items-center gap-3">
                          <span
                            className="flex-shrink-0"
                            style={{
                              ...Icons.getItem(item.name).css,
                            }}
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                            <span className="break-words font-medium group-hover:text-accent-foreground">
                              {item.name}
                            </span>
                            <span className="whitespace-normal break-words text-xs leading-tight text-muted-foreground group-hover:text-accent-foreground">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="nature">Nature</Label>
          <Popover
            modal={true}
            open={isNatureOpen}
            onOpenChange={setIsNatureOpen}
          >
            <PopoverTrigger asChild>
              <Button
                id="nature"
                variant="outline"
                role="combobox"
                aria-expanded={isNatureOpen}
                className="mt-1 h-11 w-full justify-between"
              >
                {pokemon.nature ? (
                  <span>{pokemon.nature}</span>
                ) : (
                  <span>Select nature</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <div className="flex items-center border-b px-3 py-2">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Search natures..."
                  value={natureSearch}
                  onChange={(e) => setNatureSearch(e.target.value)}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <ScrollArea className="h-[300px]" onScrollCapture={handleItemsScroll}>
                <div className="p-1">
                  {filteredNatures.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No natures found.
                    </div>
                  ) : (
                    filteredNatures.map((nature) => (
                      <Button
                        key={nature.name}
                        variant="ghost"
                        onClick={() => {
                          setNature(nature.name as NatureName);
                          setIsNatureOpen(false);
                        }}
                        className="group relative flex h-auto w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-3 text-sm font-normal outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 shrink-0 ${
                            pokemon.nature === nature.name
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                        <div className="flex w-full items-center gap-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                            <span className="break-words font-medium group-hover:text-accent-foreground">
                              {nature.name}
                            </span>
                            <span className="whitespace-normal break-words text-xs leading-tight text-muted-foreground group-hover:text-accent-foreground">
                              {nature.desc}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TabsContent>
  );
};
