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
import { Search } from 'lucide-react';

export const BasicTab = () => {
  return (
    <TabsContent value="basic" className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={pokemon.nickname}
            onChange={(e) => onUpdate({ nickname: e.target.value })}
            placeholder={pokemon.name}
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
              onValueChange={(value) => onUpdate({ level: value[0] })}
              className="flex-1"
            />
            <div className="w-12 text-center">{pokemon.level}</div>
          </div>
        </div>

        <div>
          <Label htmlFor="ability">Ability</Label>
          <Select
            value={pokemon.ability}
            onValueChange={(value) => onUpdate({ ability: value })}
          >
            <SelectTrigger id="ability" className="mt-1">
              <SelectValue placeholder="Select ability" />
            </SelectTrigger>
            <SelectContent>
              <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5">
                <Search className="mr-2 h-4 w-4 opacity-50" />
                <Input
                  placeholder="Search abilities..."
                  value={abilitySearch}
                  onChange={(e) => setAbilitySearch(e.target.value)}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <ScrollArea className="h-[200px]">
                {filteredAbilities.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No abilities found.
                  </div>
                ) : (
                  filteredAbilities.map((abilityName: string) => {
                    const abilityData = getAbilityDetails(abilityName);
                    return (
                      <SelectItem
                        key={abilityName}
                        value={abilityName}
                        className="py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{abilityName}</span>
                          {abilityData && (
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {abilityData.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="item">Item</Label>
          <Select
            value={pokemon.item || 'none'}
            onValueChange={(value) =>
              onUpdate({ item: value === 'none' ? '' : value })
            }
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
              <ScrollArea className="h-[300px]">
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
                  filteredItems.map((item) => (
                    <SelectItem
                      key={item.name}
                      value={item.name}
                      className="py-2"
                    >
                      <div className="flex items-start gap-2">
                        <img
                          src={item.image || '/placeholder.svg'}
                          alt={item.name}
                          className="mt-0.5 h-6 w-6"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
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
            onValueChange={(value) => onUpdate({ nature: value })}
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
                          {nature.description}
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
