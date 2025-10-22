'use client';

import type { GenerationNum, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import {
  getPokemonDetailsByName,
  getMoveDetails,
  getAbilityDetails,
} from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { Edit, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface PokemonCardProps {
  pokemon: PokemonInTeam;
  generation: GenerationNum;
  onRemove: () => void;
  onUpdate: (updates: any) => void;
  onEdit?: () => void;
}

export function PokemonCard({
  pokemon,
  generation,
  onRemove,
  onUpdate,
  onEdit,
}: PokemonCardProps) {
  // Data being used
  const [currPokemonAbility] = useState(getAbilityDetails(pokemon.ability));
  const [currPokemonItem] = useState(getAbilityDetails(pokemon.item));
  const [currPokemonMoves] = useState(() =>
    pokemon.moves.map((move) => getMoveDetails(move))
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Search states
  const [abilitySearch, setAbilitySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [moveSearch, setMoveSearch] = useState(['', '', '', '']);
  const [natureSearch, setNatureSearch] = useState('');

  // Filtered data based on search
  const [filteredAbilities, setFilteredAbilities] = useState(pokemon.abilities);
  const [filteredItems, setFilteredItems] = useState(items);
  const [filteredMoves, setFilteredMoves] = useState(moves);
  const [filteredNatures, setFilteredNatures] = useState(natures);

  // Update filtered abilities when search changes
  useEffect(() => {
    if (!abilitySearch.trim()) {
      setFilteredAbilities(pokemon.abilities);
    } else {
      const searchTerm = abilitySearch.toLowerCase();
      setFilteredAbilities(
        pokemon.abilities.filter((ability: string) =>
          ability.toLowerCase().includes(searchTerm)
        )
      );
    }
  }, [abilitySearch, pokemon.abilities]);

  // Update filtered items when search changes
  useEffect(() => {
    if (!itemSearch.trim()) {
      setFilteredItems(items);
    } else {
      const searchTerm = itemSearch.toLowerCase();
      setFilteredItems(
        items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        )
      );
    }
  }, [itemSearch]);

  // Update filtered moves when search changes
  useEffect(() => {
    if (!moveSearch.some((s) => s.trim())) {
      setFilteredMoves(moves);
    } else {
      setFilteredMoves(
        moves.filter((move) => {
          // If any search field is non-empty, check if the move matches
          return moveSearch.some((search, index) => {
            if (!search.trim()) return false;
            const searchTerm = search.toLowerCase();
            return (
              move.name.toLowerCase().includes(searchTerm) ||
              move.type.toLowerCase().includes(searchTerm) ||
              move.description.toLowerCase().includes(searchTerm) ||
              (move.category &&
                move.category.toLowerCase().includes(searchTerm))
            );
          });
        })
      );
    }
  }, [moveSearch]);

  // Update filtered natures when search changes
  useEffect(() => {
    if (!natureSearch.trim()) {
      setFilteredNatures(natures);
    } else {
      const searchTerm = natureSearch.toLowerCase();
      setFilteredNatures(
        natures.filter(
          (nature) =>
            nature.name.toLowerCase().includes(searchTerm) ||
            nature.description.toLowerCase().includes(searchTerm)
        )
      );
    }
  }, [natureSearch]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!isEditing) {
      setAbilitySearch('');
      setItemSearch('');
      setMoveSearch(['', '', '', '']);
      setNatureSearch('');
    }
  }, [isEditing]);

  // Calculate stat totals with nature and EVs
  const calculateStat = (
    baseStat: number,
    ev: number,
    iv: number,
    level: number,
    nature: string,
    statName: string
  ) => {
    // Simplified calculation for demonstration
    let value = Math.floor(
      ((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100
    );

    if (statName === 'hp') {
      value = value + level + 10;
    } else {
      value = value + 5;

      // Apply nature modifier
      const natureObj = natures.find((n) => n.name === nature);
      if (natureObj && natureObj.effect.increases === statName) {
        value = Math.floor(value * 1.1);
      }
      if (natureObj && natureObj.effect.decreases === statName) {
        value = Math.floor(value * 0.9);
      }
    }

    return value;
  };

  const stats = {
    hp: calculateStat(
      pokemon.stats.hp,
      pokemon.evs.hp,
      pokemon.ivs.hp,
      pokemon.level,
      pokemon.nature,
      'hp'
    ),
    attack: calculateStat(
      pokemon.stats.attack,
      pokemon.evs.attack,
      pokemon.ivs.attack,
      pokemon.level,
      pokemon.nature,
      'attack'
    ),
    defense: calculateStat(
      pokemon.stats.defense,
      pokemon.evs.defense,
      pokemon.ivs.defense,
      pokemon.level,
      pokemon.nature,
      'defense'
    ),
    spAttack: calculateStat(
      pokemon.stats.spAttack,
      pokemon.evs.spAttack,
      pokemon.ivs.spAttack,
      pokemon.level,
      pokemon.nature,
      'spAttack'
    ),
    spDefense: calculateStat(
      pokemon.stats.spDefense,
      pokemon.evs.spDefense,
      pokemon.ivs.spDefense,
      pokemon.level,
      pokemon.nature,
      'spDefense'
    ),
    speed: calculateStat(
      pokemon.stats.speed,
      pokemon.evs.speed,
      pokemon.ivs.speed,
      pokemon.level,
      pokemon.nature,
      'speed'
    ),
  };

  // Format stat name
  const formatStatName = (stat: string) => {
    switch (stat) {
      case 'hp':
        return 'HP';
      case 'attack':
        return 'Attack';
      case 'defense':
        return 'Defense';
      case 'spAttack':
        return 'Sp. Atk';
      case 'spDefense':
        return 'Sp. Def';
      case 'speed':
        return 'Speed';
      default:
        return stat;
    }
  };

  // Get nature effect on stat
  const getNatureEffect = (nature: string, stat: string) => {
    const natureObj = natures.find((n) => n.name === nature);
    if (!natureObj || !natureObj.effect.increases) return 'neutral';

    if (natureObj.effect.increases === stat) return 'positive';
    if (natureObj.effect.decreases === stat) return 'negative';
    return 'neutral';
  };

  // Update EVs with validation
  const updateEVs = (stat: string, value: number) => {
    const currentTotal = Object.values(pokemon.evs).reduce(
      (sum, ev) => sum + (ev as number),
      0
    );
    const currentStatValue = pokemon.evs[
      stat as keyof typeof pokemon.evs
    ] as number;
    const difference = value - currentStatValue;

    // Ensure total EVs don't exceed 510
    if (currentTotal + difference > 510) {
      // If exceeding, cap at 510 total
      value = currentStatValue + (510 - currentTotal);
    }

    // Ensure individual stat doesn't exceed 252
    value = Math.min(value, 252);

    // Ensure value is not negative
    value = Math.max(value, 0);

    // Update the EVs
    const newEvs = { ...pokemon.evs, [stat]: value };
    onUpdate({ evs: newEvs });
  };

  // Update IVs with validation
  const updateIVs = (stat: string, value: number) => {
    // Ensure IV is between 0 and 31
    value = Math.max(0, Math.min(31, value));

    // Update the IVs
    const newIvs = { ...pokemon.ivs, [stat]: value };
    onUpdate({ ivs: newIvs });
  };

  // Update moves
  const updateMove = (index: number, moveName: string) => {
    const newMoves = [...pokemon.moves];
    newMoves[index] = moveName;
    onUpdate({ moves: newMoves });
  };

  // Update move search
  const updateMoveSearch = (index: number, value: string) => {
    const newMoveSearch = [...moveSearch];
    newMoveSearch[index] = value;
    setMoveSearch(newMoveSearch);
  };

  // Find item details

  // Find ability details

  // Find move details

  // Find nature details

  const icon = useRef(Icons.getPokemon(pokemon.species));
  const itemIcon = useRef(Icons.getItem(pokemon.item));

  const [species] = useState(
    getPokemonDetailsByName(pokemon.species, generation)
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{
                ...icon.current.css,
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {pokemon.name || pokemon.species}
                </span>
                <span className="text-xs text-muted-foreground">
                  Lv.{pokemon.level}
                </span>
              </div>
              <div className="flex gap-1">
                {species?.types.map((type: string) => (
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
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit || (() => setIsEditing(true))}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-2 pt-0">
        <div className="flex flex-col gap-2">
          {/* Item and Ability */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/50 px-2 py-1">
              <div className="text-xs text-muted-foreground">Ability</div>
              <div className="truncate text-sm" title={pokemon.ability}>
                {pokemon.ability || 'None'}
                {currPokemonAbility && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-4 w-4 p-0"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {currPokemonAbility.desc}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1">
              <div className="text-xs text-muted-foreground">Item</div>
              <div
                className="flex items-center truncate text-sm"
                title={pokemon.item}
              >
                {currPokemonItem && (
                  <span
                    style={{
                      ...itemIcon.current.css,
                    }}
                  />
                )}
                {pokemon.item || 'None'}
                {currPokemonItem && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-4 w-4 p-0"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {currPokemonItem.desc}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {/* Moves */}
          <div className="grid grid-cols-2 gap-2">
            {pokemon.moves.map((move: string, index: number) => (
              <div key={index} className="rounded-md bg-muted/50 px-2 py-1">
                <div className="text-xs text-muted-foreground">
                  Move {index + 1}
                </div>
                <div
                  className="flex items-center truncate text-sm"
                  title={move}
                >
                  {
                    <Badge
                      className={`${
                        typeColors[currPokemonMoves[index].type]
                      } mr-1 h-3 w-3 p-0`}
                      variant="outline"
                    />
                  }
                  {move}
                  {
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{move}</span>
                              <Badge
                                className={
                                  typeColors[currPokemonMoves[index].type]
                                }
                              >
                                {currPokemonMoves[index].type}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>
                                Power: {currPokemonMoves[index].basePower}
                              </span>
                              <span>
                                Accuracy: {currPokemonMoves[index].accuracy}
                              </span>
                              <span>PP: {currPokemonMoves[index].pp}</span>
                            </div>
                            <div className="text-xs">
                              {currPokemonMoves[index].desc}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Expanded content */}
      {/* {isExpanded && ( */}
      {/*   <CardContent className="border-t px-4 py-3"> */}
      {/*     <div className="space-y-3"> */}
      {/*       <div> */}
      {/*         <div className="mb-1 text-sm font-medium">Nature</div> */}
      {/*         <Badge variant="outline" className="flex items-center"> */}
      {/*           {pokemon.nature} */}
      {/*           {getNatureDetails(pokemon.nature) && ( */}
      {/*             <TooltipProvider> */}
      {/*               <Tooltip> */}
      {/*                 <TooltipTrigger asChild> */}
      {/*                   <Button */}
      {/*                     variant="ghost" */}
      {/*                     size="icon" */}
      {/*                     className="ml-1 h-4 w-4 p-0" */}
      {/*                   > */}
      {/*                     <Info className="h-3 w-3" /> */}
      {/*                   </Button> */}
      {/*                 </TooltipTrigger> */}
      {/*                 <TooltipContent className="max-w-xs"> */}
      {/*                   {getNatureDetails(pokemon.nature)?.description} */}
      {/*                 </TooltipContent> */}
      {/*               </Tooltip> */}
      {/*             </TooltipProvider> */}
      {/*           )} */}
      {/*         </Badge> */}
      {/*       </div> */}
      {/**/}
      {/*       <div> */}
      {/*         <div className="mb-1 text-sm font-medium">Stats</div> */}
      {/*         <div className="space-y-1"> */}
      {/*           {Object.entries(stats).map(([stat, value]) => { */}
      {/*             const natureEffect = getNatureEffect(pokemon.nature, stat); */}
      {/*             return ( */}
      {/*               <div */}
      {/*                 key={stat} */}
      {/*                 className="flex items-center justify-between" */}
      {/*               > */}
      {/*                 <div className="flex items-center gap-1"> */}
      {/*                   <span className="text-sm">{formatStatName(stat)}</span> */}
      {/*                   {natureEffect === 'positive' && ( */}
      {/*                     <span className="text-xs text-green-500">↑</span> */}
      {/*                   )} */}
      {/*                   {natureEffect === 'negative' && ( */}
      {/*                     <span className="text-xs text-red-500">↓</span> */}
      {/*                   )} */}
      {/*                 </div> */}
      {/*                 <div className="flex items-center gap-2"> */}
      {/*                   <div className="text-xs text-muted-foreground"> */}
      {/*                     {pokemon.evs[stat as keyof typeof pokemon.evs]} EV */}
      {/*                   </div> */}
      {/*                   <div className="w-12 text-right text-sm font-medium"> */}
      {/*                     {value} */}
      {/*                   </div> */}
      {/*                 </div> */}
      {/*               </div> */}
      {/*             ); */}
      {/*           })} */}
      {/*         </div> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </CardContent> */}
      {/* )} */}
      {/**/}
      {/* {/* Edit Dialog */}
      {/* <Dialog open={isEditing} onOpenChange={setIsEditing}> */}
      {/*   <DialogContent className="max-w-4xl"> */}
      {/*     <DialogHeader> */}
      {/*       <DialogTitle>Edit {pokemon.name}</DialogTitle> */}
      {/*       <DialogDescription> */}
      {/*         Customize your Pokémon's stats, moves, and more */}
      {/*       </DialogDescription> */}
      {/*     </DialogHeader> */}
      {/**/}
      {/*     <Tabs defaultValue="basic"> */}
      {/*       <TabsList className="grid w-full grid-cols-4"> */}
      {/*         <TabsTrigger value="basic">Basic</TabsTrigger> */}
      {/*         <TabsTrigger value="moves">Moves</TabsTrigger> */}
      {/*         <TabsTrigger value="evs">EVs</TabsTrigger> */}
      {/*         <TabsTrigger value="ivs">IVs</TabsTrigger> */}
      {/*       </TabsList> */}
      {/**/}
      {/*       {/* Basic Tab */}
      {/*       <TabsContent value="basic" className="space-y-4 py-4"> */}
      {/*         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"> */}
      {/*           <div> */}
      {/*             <Label htmlFor="nickname">Nickname</Label> */}
      {/*             <Input */}
      {/*               id="nickname" */}
      {/*               value={pokemon.nickname} */}
      {/*               onChange={(e) => onUpdate({ nickname: e.target.value })} */}
      {/*               placeholder={pokemon.name} */}
      {/*               className="mt-1" */}
      {/*             /> */}
      {/*           </div> */}
      {/**/}
      {/*           <div> */}
      {/*             <Label htmlFor="level">Level</Label> */}
      {/*             <div className="flex items-center gap-2"> */}
      {/*               <Slider */}
      {/*                 id="level" */}
      {/*                 value={[pokemon.level]} */}
      {/*                 min={1} */}
      {/*                 max={100} */}
      {/*                 step={1} */}
      {/*                 onValueChange={(value) => onUpdate({ level: value[0] })} */}
      {/*                 className="flex-1" */}
      {/*               /> */}
      {/*               <div className="w-12 text-center">{pokemon.level}</div> */}
      {/*             </div> */}
      {/*           </div> */}
      {/**/}
      {/*           <div> */}
      {/*             <Label htmlFor="ability">Ability</Label> */}
      {/*             <Select */}
      {/*               value={pokemon.ability} */}
      {/*               onValueChange={(value) => onUpdate({ ability: value })} */}
      {/*             > */}
      {/*               <SelectTrigger id="ability" className="mt-1"> */}
      {/*                 <SelectValue placeholder="Select ability" /> */}
      {/*               </SelectTrigger> */}
      {/*               <SelectContent> */}
      {/*                 <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5"> */}
      {/*                   <Search className="mr-2 h-4 w-4 opacity-50" /> */}
      {/*                   <Input */}
      {/*                     placeholder="Search abilities..." */}
      {/*                     value={abilitySearch} */}
      {/*                     onChange={(e) => setAbilitySearch(e.target.value)} */}
      {/*                     className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0" */}
      {/*                   /> */}
      {/*                 </div> */}
      {/*                 <ScrollArea className="h-[200px]"> */}
      {/*                   {filteredAbilities.length === 0 ? ( */}
      {/*                     <div className="py-6 text-center text-sm text-muted-foreground"> */}
      {/*                       No abilities found. */}
      {/*                     </div> */}
      {/*                   ) : ( */}
      {/*                     filteredAbilities.map((abilityName: string) => { */}
      {/*                       const abilityData = getAbilityDetails(abilityName); */}
      {/*                       return ( */}
      {/*                         <SelectItem */}
      {/*                           key={abilityName} */}
      {/*                           value={abilityName} */}
      {/*                           className="py-2" */}
      {/*                         > */}
      {/*                           <div className="flex flex-col"> */}
      {/*                             <span className="font-medium"> */}
      {/*                               {abilityName} */}
      {/*                             </span> */}
      {/*                             {abilityData && ( */}
      {/*                               <span className="line-clamp-2 text-xs text-muted-foreground"> */}
      {/*                                 {abilityData.description} */}
      {/*                               </span> */}
      {/*                             )} */}
      {/*                           </div> */}
      {/*                         </SelectItem> */}
      {/*                       ); */}
      {/*                     }) */}
      {/*                   )} */}
      {/*                 </ScrollArea> */}
      {/*               </SelectContent> */}
      {/*             </Select> */}
      {/*           </div> */}
      {/**/}
      {/*           <div> */}
      {/*             <Label htmlFor="item">Item</Label> */}
      {/*             <Select */}
      {/*               value={pokemon.item || 'none'} */}
      {/*               onValueChange={(value) => */}
      {/*                 onUpdate({ item: value === 'none' ? '' : value }) */}
      {/*               } */}
      {/*             > */}
      {/*               <SelectTrigger id="item" className="mt-1"> */}
      {/*                 <SelectValue placeholder="Select item" /> */}
      {/*               </SelectTrigger> */}
      {/*               <SelectContent> */}
      {/*                 <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5"> */}
      {/*                   <Search className="mr-2 h-4 w-4 opacity-50" /> */}
      {/*                   <Input */}
      {/*                     placeholder="Search items..." */}
      {/*                     value={itemSearch} */}
      {/*                     onChange={(e) => setItemSearch(e.target.value)} */}
      {/*                     className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0" */}
      {/*                   /> */}
      {/*                 </div> */}
      {/*                 <ScrollArea className="h-[300px]"> */}
      {/*                   <SelectItem value="none" className="py-2"> */}
      {/*                     <div className="flex items-center"> */}
      {/*                       <span className="font-medium">None</span> */}
      {/*                     </div> */}
      {/*                   </SelectItem> */}
      {/*                   {filteredItems.length === 0 ? ( */}
      {/*                     <div className="py-6 text-center text-sm text-muted-foreground"> */}
      {/*                       No items found. */}
      {/*                     </div> */}
      {/*                   ) : ( */}
      {/*                     filteredItems.map((item) => ( */}
      {/*                       <SelectItem */}
      {/*                         key={item.name} */}
      {/*                         value={item.name} */}
      {/*                         className="py-2" */}
      {/*                       > */}
      {/*                         <div className="flex items-start gap-2"> */}
      {/*                           <img */}
      {/*                             src={item.image || '/placeholder.svg'} */}
      {/*                             alt={item.name} */}
      {/*                             className="mt-0.5 h-6 w-6" */}
      {/*                           /> */}
      {/*                           <div className="flex flex-col"> */}
      {/*                             <span className="font-medium"> */}
      {/*                               {item.name} */}
      {/*                             </span> */}
      {/*                             <span className="line-clamp-2 text-xs text-muted-foreground"> */}
      {/*                               {item.description} */}
      {/*                             </span> */}
      {/*                           </div> */}
      {/*                         </div> */}
      {/*                       </SelectItem> */}
      {/*                     )) */}
      {/*                   )} */}
      {/*                 </ScrollArea> */}
      {/*               </SelectContent> */}
      {/*             </Select> */}
      {/*           </div> */}
      {/**/}
      {/*           <div> */}
      {/*             <Label htmlFor="nature">Nature</Label> */}
      {/*             <Select */}
      {/*               value={pokemon.nature} */}
      {/*               onValueChange={(value) => onUpdate({ nature: value })} */}
      {/*             > */}
      {/*               <SelectTrigger id="nature" className="mt-1"> */}
      {/*                 <SelectValue placeholder="Select nature" /> */}
      {/*               </SelectTrigger> */}
      {/*               <SelectContent> */}
      {/*                 <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5"> */}
      {/*                   <Search className="mr-2 h-4 w-4 opacity-50" /> */}
      {/*                   <Input */}
      {/*                     placeholder="Search natures..." */}
      {/*                     value={natureSearch} */}
      {/*                     onChange={(e) => setNatureSearch(e.target.value)} */}
      {/*                     className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0" */}
      {/*                   /> */}
      {/*                 </div> */}
      {/*                 <ScrollArea className="h-[300px]"> */}
      {/*                   {filteredNatures.length === 0 ? ( */}
      {/*                     <div className="py-6 text-center text-sm text-muted-foreground"> */}
      {/*                       No natures found. */}
      {/*                     </div> */}
      {/*                   ) : ( */}
      {/*                     filteredNatures.map((nature) => ( */}
      {/*                       <SelectItem */}
      {/*                         key={nature.name} */}
      {/*                         value={nature.name} */}
      {/*                         className="py-2" */}
      {/*                       > */}
      {/*                         <div className="flex flex-col"> */}
      {/*                           <span className="font-medium"> */}
      {/*                             {nature.name} */}
      {/*                           </span> */}
      {/*                           <span className="text-xs text-muted-foreground"> */}
      {/*                             {nature.description} */}
      {/*                           </span> */}
      {/*                         </div> */}
      {/*                       </SelectItem> */}
      {/*                     )) */}
      {/*                   )} */}
      {/*                 </ScrollArea> */}
      {/*               </SelectContent> */}
      {/*             </Select> */}
      {/*           </div> */}
      {/*         </div> */}
      {/*       </TabsContent> */}
      {/**/}
      {/*       {/* Moves Tab */}
      {/*       <TabsContent value="moves" className="space-y-4 py-4"> */}
      {/*         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"> */}
      {/*           {[0, 1, 2, 3].map((index) => ( */}
      {/*             <div key={index}> */}
      {/*               <Label htmlFor={`move-${index}`}>Move {index + 1}</Label> */}
      {/*               <Select */}
      {/*                 value={pokemon.moves[index] || 'none'} */}
      {/*                 onValueChange={(value) => */}
      {/*                   updateMove(index, value === 'none' ? '' : value) */}
      {/*                 } */}
      {/*               > */}
      {/*                 <SelectTrigger id={`move-${index}`} className="mt-1"> */}
      {/*                   <SelectValue placeholder="Select move" /> */}
      {/*                 </SelectTrigger> */}
      {/*                 <SelectContent> */}
      {/*                   <div className="sticky top-0 z-10 flex items-center border-b bg-background px-2 py-1.5"> */}
      {/*                     <Search className="mr-2 h-4 w-4 opacity-50" /> */}
      {/*                     <Input */}
      {/*                       placeholder="Search moves..." */}
      {/*                       value={moveSearch[index]} */}
      {/*                       onChange={(e) => */}
      {/*                         updateMoveSearch(index, e.target.value) */}
      {/*                       } */}
      {/*                       className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0" */}
      {/*                     /> */}
      {/*                   </div> */}
      {/*                   <ScrollArea className="h-[300px]"> */}
      {/*                     <SelectItem value="none" className="py-2"> */}
      {/*                       <div className="flex items-center"> */}
      {/*                         <span className="font-medium">None</span> */}
      {/*                       </div> */}
      {/*                     </SelectItem> */}
      {/*                     {filteredMoves.length === 0 ? ( */}
      {/*                       <div className="py-6 text-center text-sm text-muted-foreground"> */}
      {/*                         No moves found. */}
      {/*                       </div> */}
      {/*                     ) : ( */}
      {/*                       filteredMoves.map((move) => ( */}
      {/*                         <SelectItem */}
      {/*                           key={move.name} */}
      {/*                           value={move.name} */}
      {/*                           className="py-2" */}
      {/*                         > */}
      {/*                           <div className="flex items-start gap-2"> */}
      {/*                             <Badge */}
      {/*                               className={`${ */}
      {/*                                 typeColors[move.type] */}
      {/*                               } mt-0.5 flex h-5 w-5 items-center justify-center p-0`} */}
      {/*                             > */}
      {/*                               <span className="sr-only">{move.type}</span> */}
      {/*                             </Badge> */}
      {/*                             <div className="flex flex-col"> */}
      {/*                               <div className="flex items-center gap-2"> */}
      {/*                                 <span className="font-medium"> */}
      {/*                                   {move.name} */}
      {/*                                 </span> */}
      {/*                                 <span className="text-xs text-muted-foreground"> */}
      {/*                                   {move.power */}
      {/*                                     ? `${move.power} BP` */}
      {/*                                     : 'Status'} */}
      {/*                                 </span> */}
      {/*                               </div> */}
      {/*                               <span className="line-clamp-2 text-xs text-muted-foreground"> */}
      {/*                                 {move.description} */}
      {/*                               </span> */}
      {/*                             </div> */}
      {/*                           </div> */}
      {/*                         </SelectItem> */}
      {/*                       )) */}
      {/*                     )} */}
      {/*                   </ScrollArea> */}
      {/*                 </SelectContent> */}
      {/*               </Select> */}
      {/*             </div> */}
      {/*           ))} */}
      {/*         </div> */}
      {/*       </TabsContent> */}
      {/**/}
      {/*       {/* EVs Tab */}
      {/*       <TabsContent value="evs" className="py-4"> */}
      {/*         <div className="mb-4"> */}
      {/*           <div className="flex items-center justify-between"> */}
      {/*             <Label>EV Distribution</Label> */}
      {/*             <div className="text-sm text-muted-foreground"> */}
      {/*               {Object.values(pokemon.evs).reduce( */}
      {/*                 (sum, ev) => sum + (ev as number), */}
      {/*                 0 */}
      {/*               )} */}
      {/*               /510 */}
      {/*             </div> */}
      {/*           </div> */}
      {/*           <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted"> */}
      {/*             <div */}
      {/*               className="h-full bg-primary transition-all" */}
      {/*               style={{ */}
      {/*                 width: `${ */}
      {/*                   (Object.values(pokemon.evs).reduce( */}
      {/*                     (sum, ev) => sum + (ev as number), */}
      {/*                     0 */}
      {/*                   ) / */}
      {/*                     510) * */}
      {/*                   100 */}
      {/*                 }%`, */}
      {/*               }} */}
      {/*             /> */}
      {/*           </div> */}
      {/*         </div> */}
      {/**/}
      {/*         <div className="space-y-4"> */}
      {/*           {Object.entries(pokemon.evs).map(([stat, value]) => ( */}
      {/*             <div key={stat}> */}
      {/*               <div className="flex items-center justify-between"> */}
      {/*                 <Label htmlFor={`ev-${stat}`}> */}
      {/*                   {formatStatName(stat)} */}
      {/*                 </Label> */}
      {/*                 <div className="text-sm">{value}/252</div> */}
      {/*               </div> */}
      {/*               <div className="flex items-center gap-2"> */}
      {/*                 <Slider */}
      {/*                   id={`ev-${stat}`} */}
      {/*                   value={[value as number]} */}
      {/*                   min={0} */}
      {/*                   max={252} */}
      {/*                   step={4} */}
      {/*                   onValueChange={(val) => updateEVs(stat, val[0])} */}
      {/*                   className="flex-1" */}
      {/*                 /> */}
      {/*                 <Input */}
      {/*                   type="number" */}
      {/*                   value={value as number} */}
      {/*                   onChange={(e) => */}
      {/*                     updateEVs(stat, Number.parseInt(e.target.value) || 0) */}
      {/*                   } */}
      {/*                   className="w-16" */}
      {/*                   min={0} */}
      {/*                   max={252} */}
      {/*                   step={4} */}
      {/*                 /> */}
      {/*               </div> */}
      {/*             </div> */}
      {/*           ))} */}
      {/*         </div> */}
      {/*       </TabsContent> */}
      {/**/}
      {/*       {/* IVs Tab */}
      {/*       <TabsContent value="ivs" className="py-4"> */}
      {/*         <div className="space-y-4"> */}
      {/*           {Object.entries(pokemon.ivs).map(([stat, value]) => ( */}
      {/*             <div key={stat}> */}
      {/*               <div className="flex items-center justify-between"> */}
      {/*                 <Label htmlFor={`iv-${stat}`}> */}
      {/*                   {formatStatName(stat)} */}
      {/*                 </Label> */}
      {/*                 <div className="text-sm">{value}/31</div> */}
      {/*               </div> */}
      {/*               <div className="flex items-center gap-2"> */}
      {/*                 <Slider */}
      {/*                   id={`iv-${stat}`} */}
      {/*                   value={[value as number]} */}
      {/*                   min={0} */}
      {/*                   max={31} */}
      {/*                   step={1} */}
      {/*                   onValueChange={(val) => updateIVs(stat, val[0])} */}
      {/*                   className="flex-1" */}
      {/*                 /> */}
      {/*                 <Input */}
      {/*                   type="number" */}
      {/*                   value={value as number} */}
      {/*                   onChange={(e) => */}
      {/*                     updateIVs(stat, Number.parseInt(e.target.value) || 0) */}
      {/*                   } */}
      {/*                   className="w-16" */}
      {/*                   min={0} */}
      {/*                   max={31} */}
      {/*                   step={1} */}
      {/*                 /> */}
      {/*               </div> */}
      {/*             </div> */}
      {/*           ))} */}
      {/**/}
      {/*           <div className="flex justify-end gap-2"> */}
      {/*             <Button */}
      {/*               variant="outline" */}
      {/*               onClick={() => */}
      {/*                 onUpdate({ */}
      {/*                   ivs: { */}
      {/*                     hp: 31, */}
      {/*                     attack: 31, */}
      {/*                     defense: 31, */}
      {/*                     spAttack: 31, */}
      {/*                     spDefense: 31, */}
      {/*                     speed: 31, */}
      {/*                   }, */}
      {/*                 }) */}
      {/*               } */}
      {/*             > */}
      {/*               Max All */}
      {/*             </Button> */}
      {/*             <Button */}
      {/*               variant="outline" */}
      {/*               onClick={() => */}
      {/*                 onUpdate({ */}
      {/*                   ivs: { */}
      {/*                     hp: 31, */}
      {/*                     attack: 0, */}
      {/*                     defense: 31, */}
      {/*                     spAttack: 31, */}
      {/*                     spDefense: 31, */}
      {/*                     speed: 0, */}
      {/*                   }, */}
      {/*                 }) */}
      {/*               } */}
      {/*             > */}
      {/*               Trick Room */}
      {/*             </Button> */}
      {/*           </div> */}
      {/*         </div> */}
      {/*       </TabsContent> */}
      {/*     </Tabs> */}
      {/**/}
      {/*     <DialogFooter> */}
      {/*       <Button variant="outline" onClick={() => setIsEditing(false)}> */}
      {/*         Cancel */}
      {/*       </Button> */}
      {/*       <Button onClick={() => setIsEditing(false)}> */}
      {/*         <Check className="mr-2 h-4 w-4" /> */}
      {/*         Save Changes */}
      {/*       </Button> */}
      {/*     </DialogFooter> */}
      {/*   </DialogContent> */}
      {/* </Dialog> */}
    </Card>
  );
}
