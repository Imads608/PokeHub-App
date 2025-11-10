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
  Input,
  Label,
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
import { Search } from 'lucide-react';
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
          <Select
            value={pokemon.item || ''}
            onValueChange={(value) => setItem(value as ItemName)}
          >
            <SelectTrigger id="item" className="mt-1">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5">
                <Search className="mr-2 h-4 w-4 opacity-50" />
                <Input
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <ScrollArea className="h-[300px]" onScroll={handleItemsScroll}>
                <SelectItem value="none" className="py-2">
                  <div className="flex items-center">
                    <span className="font-medium">None</span>
                  </div>
                </SelectItem>
                {filteredItems.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No items found.
                  </div>
                ) : (
                  filteredItems.slice(0, itemsToShow).map((item) => (
                    <SelectItem
                      key={item.name}
                      value={item.name}
                      className="py-2"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          style={{
                            ...Icons.getItem(item.name).css,
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="nature">Nature</Label>
          <Select
            value={pokemon.nature}
            onValueChange={(value) => setNature(value as NatureName)}
          >
            <SelectTrigger id="nature" className="mt-1">
              <SelectValue placeholder="Select nature" />
            </SelectTrigger>
            <SelectContent>
              <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5">
                <Search className="mr-2 h-4 w-4 opacity-50" />
                <Input
                  placeholder="Search natures..."
                  value={natureSearch}
                  onChange={(e) => setNatureSearch(e.target.value)}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <ScrollArea className="h-[300px]">
                {filteredNatures.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No natures found.
                  </div>
                ) : (
                  filteredNatures.map((nature) => (
                    <SelectItem
                      key={nature.name}
                      value={nature.name}
                      className="py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{nature.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {nature.desc}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </div>
    </TabsContent>
  );
};
