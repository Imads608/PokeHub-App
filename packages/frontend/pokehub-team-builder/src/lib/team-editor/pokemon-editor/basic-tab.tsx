import { useTeamEditorContext } from '../../context/team-editor.context';
import type { AbilityName, ItemName, NatureName, Species } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import {
  getItems,
  getNatureDescription,
  getNatures,
  getPokemonAbilitiesDetailsFromSpecies,
} from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import {
  Input,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Slider,
  TabsContent,
} from '@pokehub/frontend/shared-ui-components';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SearchableSelect } from './searchable-select';

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
  const [natures] = useState(() =>
    getNatures(generation.value).map((nature) => ({
      name: nature.name,
      desc: getNatureDescription(nature.name, generation.value),
    }))
  );
  const [items] = useState(() => getItems(generation.value));

  useEffect(() => {
    abilities.length > 0 && abilities[0] && setAbility(abilities[0].name);
  }, []);

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
            <SelectTrigger id="ability" className="mt-1 h-11">
              <div className="flex items-center">
                <span className="truncate">
                  {pokemon.ability || 'Select ability'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="w-[400px]">
              <ScrollArea className="h-[200px]">
                {abilities.map(
                  (ability) =>
                    ability && (
                      <SelectItem
                        key={ability.id}
                        value={ability.name}
                        className="py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{ability.name}</span>
                          <span className="whitespace-normal break-words text-xs leading-tight text-muted-foreground">
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
        <SearchableSelect
          id="item"
          label="Item"
          placeholder="Select item"
          value={pokemon.item}
          items={items}
          onValueChange={(value) => setItem(value as ItemName)}
          onClear={() => setItem('' as ItemName)}
          renderTriggerContent={(selectedItem) =>
            selectedItem ? (
              <div className="flex items-center gap-2">
                <span
                  style={{
                    ...Icons.getItem(selectedItem.name).css,
                  }}
                />
                <span>{selectedItem.name}</span>
              </div>
            ) : (
              <span>Select item</span>
            )
          }
          renderItemContent={(item, isSelected) => (
            <>
              <Check
                className={`mr-2 h-4 w-4 shrink-0 ${
                  isSelected ? 'opacity-100' : 'opacity-0'
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
            </>
          )}
        />

        <SearchableSelect
          id="nature"
          label="Nature"
          placeholder="Select nature"
          value={pokemon.nature}
          items={natures}
          onValueChange={(value) => setNature(value as NatureName)}
        />
      </div>
    </TabsContent>
  );
};
