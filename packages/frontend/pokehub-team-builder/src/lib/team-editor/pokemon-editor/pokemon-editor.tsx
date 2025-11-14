'use client';

import { BasicTab } from './basic-tab';
import { MovesTab } from './moves-tab';
import { EVsTab } from './evs-tab';
import type { Species } from '@pkmn/dex';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import {
  Button,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { Check } from 'lucide-react';

interface PokemonEditorProps {
  activePokemon: PokemonInTeam;
  species: Species;
}

export function PokemonEditor({ activePokemon, species }: PokemonEditorProps) {
  // // Search states
  // const [abilitySearch, setAbilitySearch] = useState("")
  // const [itemSearch, setItemSearch] = useState("")
  // const [moveSearch, setMoveSearch] = useState(["", "", "", ""])
  // const [natureSearch, setNatureSearch] = useState("")
  //
  // // Filtered data based on search
  // const [filteredAbilities, setFilteredAbilities] = useState(pokemon.abilities)
  // const [filteredItems, setFilteredItems] = useState(items)
  // const [filteredMoves, setFilteredMoves] = useState(moves)
  // const [filteredNatures, setFilteredNatures] = useState(natures)
  //
  // // Update filtered abilities when search changes
  // useEffect(() => {
  //   if (!abilitySearch.trim()) {
  //     setFilteredAbilities(pokemon.abilities)
  //   } else {
  //     const searchTerm = abilitySearch.toLowerCase()
  //     setFilteredAbilities(pokemon.abilities.filter((ability: string) => ability.toLowerCase().includes(searchTerm)))
  //   }
  // }, [abilitySearch, pokemon.abilities])
  //
  // // Update filtered items when search changes
  // useEffect(() => {
  //   if (!itemSearch.trim()) {
  //     setFilteredItems(items)
  //   } else {
  //     const searchTerm = itemSearch.toLowerCase()
  //     setFilteredItems(
  //       items.filter(
  //         (item) => item.name.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm),
  //       ),
  //     )
  //   }
  // }, [itemSearch])
  //
  // // Update filtered moves when search changes
  // useEffect(() => {
  //   if (!moveSearch.some((s) => s.trim())) {
  //     setFilteredMoves(moves)
  //   } else {
  //     setFilteredMoves(
  //       moves.filter((move) => {
  //         // If any search field is non-empty, check if the move matches
  //         return moveSearch.some((search, index) => {
  //           if (!search.trim()) return false
  //           const searchTerm = search.toLowerCase()
  //           return (
  //             move.name.toLowerCase().includes(searchTerm) ||
  //             move.type.toLowerCase().includes(searchTerm) ||
  //             move.description.toLowerCase().includes(searchTerm) ||
  //             (move.category && move.category.toLowerCase().includes(searchTerm))
  //           )
  //         })
  //       }),
  //     )
  //   }
  // }, [moveSearch])
  //
  // // Update filtered natures when search changes
  // useEffect(() => {
  //   if (!natureSearch.trim()) {
  //     setFilteredNatures(natures)
  //   } else {
  //     const searchTerm = natureSearch.toLowerCase()
  //     setFilteredNatures(
  //       natures.filter(
  //         (nature) =>
  //           nature.name.toLowerCase().includes(searchTerm) || nature.description.toLowerCase().includes(searchTerm),
  //       ),
  //     )
  //   }
  // }, [natureSearch])
  //
  // // Format stat name
  // const formatStatName = (stat: string) => {
  //   switch (stat) {
  //     case "hp":
  //       return "HP"
  //     case "attack":
  //       return "Attack"
  //     case "defense":
  //       return "Defense"
  //     case "spAttack":
  //       return "Sp. Atk"
  //     case "spDefense":
  //       return "Sp. Def"
  //     case "speed":
  //       return "Speed"
  //     default:
  //       return stat
  //   }
  // }
  //
  // // Update EVs with validation
  // const updateEVs = (stat: string, value: number) => {
  //   const currentTotal = Object.values(pokemon.evs).reduce((sum, ev) => sum + (ev as number), 0)
  //   const currentStatValue = pokemon.evs[stat as keyof typeof pokemon.evs] as number
  //   const difference = value - currentStatValue
  //
  //   // Ensure total EVs don't exceed 510
  //   if (currentTotal + difference > 510) {
  //     // If exceeding, cap at 510 total
  //     value = currentStatValue + (510 - currentTotal)
  //   }
  //
  //   // Ensure individual stat doesn't exceed 252
  //   value = Math.min(value, 252)
  //
  //   // Ensure value is not negative
  //   value = Math.max(value, 0)
  //
  //   // Update the EVs
  //   const newEvs = { ...pokemon.evs, [stat]: value }
  //   onUpdate({ evs: newEvs })
  // }
  //
  // // Update IVs with validation
  // const updateIVs = (stat: string, value: number) => {
  //   // Ensure IV is between 0 and 31
  //   value = Math.max(0, Math.min(31, value))
  //
  //   // Update the IVs
  //   const newIvs = { ...pokemon.ivs, [stat]: value }
  //   onUpdate({ ivs: newIvs })
  // }
  //
  // // Update moves
  // const updateMove = (index: number, moveName: string) => {
  //   const newMoves = [...pokemon.moves]
  //   newMoves[index] = moveName
  //   onUpdate({ moves: newMoves })
  // }
  //
  // // Update move search
  // const updateMoveSearch = (index: number, value: string) => {
  //   const newMoveSearch = [...moveSearch]
  //   newMoveSearch[index] = value
  //   setMoveSearch(newMoveSearch)
  // }
  //
  // // Find item details
  // const getItemDetails = (itemName: string) => {
  //   return items.find((item) => item.name === itemName) || null
  // }
  //
  // // Find ability details
  // const getAbilityDetails = (abilityName: string) => {
  //   return abilities.find((ability) => ability.name === abilityName) || null
  // }
  //
  // // Find move details
  // const getMoveDetails = (moveName: string) => {
  //   return moves.find((move) => move.name === moveName) || null
  // }
  //
  // // Find nature details
  // const getNatureDetails = (natureName: string) => {
  //   return natures.find((nature) => nature.name === natureName) || null
  // }
  //
  return (
    <>
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="moves">Moves</TabsTrigger>
          <TabsTrigger value="evs">EVs</TabsTrigger>
          <TabsTrigger value="ivs">IVs</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <BasicTab species={species} pokemon={activePokemon} />

        {/* Moves Tab */}
        <MovesTab species={species} pokemon={activePokemon} />

        {/* EVs Tab */}
        <EVsTab pokemon={activePokemon} />

        {/* <TabsContent value="moves" className="space-y-4 py-4"> */}
        {/*   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"> */}
        {/*     {[0, 1, 2, 3].map((index) => ( */}
        {/*       <div key={index}> */}
        {/*         <Label htmlFor={`move-${index}`}>Move {index + 1}</Label> */}
        {/*         <Select */}
        {/*           value={pokemon.moves[index] || "none"} */}
        {/*           onValueChange={(value) => updateMove(index, value === "none" ? "" : value)} */}
        {/*         > */}
        {/*           <SelectTrigger id={`move-${index}`} className="mt-1"> */}
        {/*             <SelectValue placeholder="Select move" /> */}
        {/*           </SelectTrigger> */}
        {/*           <SelectContent> */}
        {/*             <div className="flex items-center px-2 py-1.5 border-b sticky top-0 bg-background z-10"> */}
        {/*               <Search className="w-4 h-4 mr-2 opacity-50" /> */}
        {/*               <Input */}
        {/*                 placeholder="Search moves..." */}
        {/*                 value={moveSearch[index]} */}
        {/*                 onChange={(e) => updateMoveSearch(index, e.target.value)} */}
        {/*                 className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0" */}
        {/*               /> */}
        {/*             </div> */}
        {/*             <ScrollArea className="h-[300px]"> */}
        {/*               <SelectItem value="none" className="py-2"> */}
        {/*                 <div className="flex items-center"> */}
        {/*                   <span className="font-medium">None</span> */}
        {/*                 </div> */}
        {/*               </SelectItem> */}
        {/*               {filteredMoves.length === 0 ? ( */}
        {/*                 <div className="py-6 text-center text-sm text-muted-foreground">No moves found.</div> */}
        {/*               ) : ( */}
        {/*                 filteredMoves.map((move) => ( */}
        {/*                   <SelectItem key={move.name} value={move.name} className="py-2"> */}
        {/*                     <div className="flex items-start gap-2"> */}
        {/*                       <Badge */}
        {/*                         className={`${typeColors[move.type]} h-5 w-5 p-0 flex items-center justify-center mt-0.5`} */}
        {/*                       > */}
        {/*                         <span className="sr-only">{move.type}</span> */}
        {/*                       </Badge> */}
        {/*                       <div className="flex flex-col"> */}
        {/*                         <div className="flex items-center gap-2"> */}
        {/*                           <span className="font-medium">{move.name}</span> */}
        {/*                           <span className="text-xs text-muted-foreground"> */}
        {/*                             {move.power ? `${move.power} BP` : "Status"} */}
        {/*                           </span> */}
        {/*                         </div> */}
        {/*                         <span className="text-xs text-muted-foreground line-clamp-2">{move.description}</span> */}
        {/*                       </div> */}
        {/*                     </div> */}
        {/*                   </SelectItem> */}
        {/*                 )) */}
        {/*               )} */}
        {/*             </ScrollArea> */}
        {/*           </SelectContent> */}
        {/*         </Select> */}
        {/*       </div> */}
        {/*     ))} */}
        {/*   </div> */}
        {/* </TabsContent> */}

        {/* EVs Tab */}
        {/* <TabsContent value="evs" className="py-4"> */}
        {/*   <div className="mb-4"> */}
        {/*     <div className="flex items-center justify-between"> */}
        {/*       <Label>EV Distribution</Label> */}
        {/*       <div className="text-sm text-muted-foreground"> */}
        {/*         {Object.values(pokemon.evs).reduce((sum, ev) => sum + (ev as number), 0)}/510 */}
        {/*       </div> */}
        {/*     </div> */}
        {/*     <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted"> */}
        {/*       <div */}
        {/*         className="h-full bg-primary transition-all" */}
        {/*         style={{ */}
        {/*           width: `${(Object.values(pokemon.evs).reduce((sum, ev) => sum + (ev as number), 0) / 510) * 100}%`, */}
        {/*         }} */}
        {/*       /> */}
        {/*     </div> */}
        {/*   </div> */}
        {/**/}
        {/*   <div className="space-y-4"> */}
        {/*     {Object.entries(pokemon.evs).map(([stat, value]) => ( */}
        {/*       <div key={stat}> */}
        {/*         <div className="flex items-center justify-between"> */}
        {/*           <Label htmlFor={`ev-${stat}`}>{formatStatName(stat)}</Label> */}
        {/*           <div className="text-sm">{value}/252</div> */}
        {/*         </div> */}
        {/*         <div className="flex items-center gap-2"> */}
        {/*           <Slider */}
        {/*             id={`ev-${stat}`} */}
        {/*             value={[value as number]} */}
        {/*             min={0} */}
        {/*             max={252} */}
        {/*             step={4} */}
        {/*             onValueChange={(val) => updateEVs(stat, val[0])} */}
        {/*             className="flex-1" */}
        {/*           /> */}
        {/*           <Input */}
        {/*             type="number" */}
        {/*             value={value as number} */}
        {/*             onChange={(e) => updateEVs(stat, Number.parseInt(e.target.value) || 0)} */}
        {/*             className="w-16" */}
        {/*             min={0} */}
        {/*             max={252} */}
        {/*             step={4} */}
        {/*           /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     ))} */}
        {/*   </div> */}
        {/* </TabsContent> */}

        {/* IVs Tab */}
        {/* <TabsContent value="ivs" className="py-4"> */}
        {/*   <div className="space-y-4"> */}
        {/*     {Object.entries(pokemon.ivs).map(([stat, value]) => ( */}
        {/*       <div key={stat}> */}
        {/*         <div className="flex items-center justify-between"> */}
        {/*           <Label htmlFor={`iv-${stat}`}>{formatStatName(stat)}</Label> */}
        {/*           <div className="text-sm">{value}/31</div> */}
        {/*         </div> */}
        {/*         <div className="flex items-center gap-2"> */}
        {/*           <Slider */}
        {/*             id={`iv-${stat}`} */}
        {/*             value={[value as number]} */}
        {/*             min={0} */}
        {/*             max={31} */}
        {/*             step={1} */}
        {/*             onValueChange={(val) => updateIVs(stat, val[0])} */}
        {/*             className="flex-1" */}
        {/*           /> */}
        {/*           <Input */}
        {/*             type="number" */}
        {/*             value={value as number} */}
        {/*             onChange={(e) => updateIVs(stat, Number.parseInt(e.target.value) || 0)} */}
        {/*             className="w-16" */}
        {/*             min={0} */}
        {/*             max={31} */}
        {/*             step={1} */}
        {/*           /> */}
        {/*         </div> */}
        {/*       </div> */}
        {/*     ))} */}
        {/**/}
        {/*     <div className="flex justify-end gap-2"> */}
        {/*       <Button */}
        {/*         variant="outline" */}
        {/*         onClick={() => */}
        {/*           onUpdate({ */}
        {/*             ivs: { */}
        {/*               hp: 31, */}
        {/*               attack: 31, */}
        {/*               defense: 31, */}
        {/*               spAttack: 31, */}
        {/*               spDefense: 31, */}
        {/*               speed: 31, */}
        {/*             }, */}
        {/*           }) */}
        {/*         } */}
        {/*       > */}
        {/*         Max All */}
        {/*       </Button> */}
        {/*       <Button */}
        {/*         variant="outline" */}
        {/*         onClick={() => */}
        {/*           onUpdate({ */}
        {/*             ivs: { */}
        {/*               hp: 31, */}
        {/*               attack: 0, */}
        {/*               defense: 31, */}
        {/*               spAttack: 31, */}
        {/*               spDefense: 31, */}
        {/*               speed: 0, */}
        {/*             }, */}
        {/*           }) */}
        {/*         } */}
        {/*       > */}
        {/*         Trick Room */}
        {/*       </Button> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </TabsContent> */}
      </Tabs>

      <DialogFooter>
        <Button variant="outline" onClick={() => console.log('implement')}>
          Cancel
        </Button>
        <Button onClick={() => console.log('implemnent')}>
          <Check className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}
