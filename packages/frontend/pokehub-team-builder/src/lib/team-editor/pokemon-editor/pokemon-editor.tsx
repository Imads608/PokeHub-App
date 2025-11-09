"use client"

import { useState, useEffect } from "react"
import { Check, Search } from "lucide-react"
import { Button, DialogFooter, Input, Label, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider, Tabs, TabsContent, TabsList, TabsTrigger } from "@pokehub/frontend/shared-ui-components"
import type { PokemonInTeam } from "@pokehub/frontend/pokemon-types"
import type { GenerationNum, NatureName, SpeciesName } from "@pkmn/dex"
import { getStatName, getStats } from "@pokehub/frontend/dex-data-provider"

interface PokemonEditorProps {
  pokemon: Partial<PokemonInTeam>;
  speciesName: SpeciesName;
  generation: GenerationNum;
  onUpdate: (updates: any) => void
  onClose: () => void
  typeColors: Record<string, string>
}

export function PokemonEditor({ pokemon, speciesName, generation, onUpdate, onClose, typeColors }: PokemonEditorProps) {
  
  // Data being used
  const [currPokemonAbility] = useState(pokemon?.ability || undefined);
  const [currPokemonItem] = useState(pokemon?.item || undefined);
  const [currPokemonMoves] = useState(
    pokemon?.moves || [undefined, undefined, undefined, undefined]
  );
  const [currLevel] = useState(pokemon.level || 50);
  const [currPokemonNature] = useState<NatureName>(pokemon.nature || 'Adamant');
  const [currNickname] = useState(pokemon.name || speciesName);

  const [statsDetails] = useState(() => {
    const stats = getStats();
    const statNames = stats.map((statId) => getStatName(statId, generation));
    return {
      ids: stats,
      names: statNames,
    };
  });
  const [evs] = useState(() =>
    statsDetails.ids.map((statId) => (pokemon.evs ? pokemon.evs[statId] : 0))
  );

  const [ivs] = useState(() =>
    statsDetails.ids.map((statId) => (pokemon.ivs ? pokemon.ivs[statId] : 0))
  );

  // Search states
  const [abilitySearch, setAbilitySearch] = useState("")
  const [itemSearch, setItemSearch] = useState("")
  const [moveSearch, setMoveSearch] = useState(["", "", "", ""])
  const [natureSearch, setNatureSearch] = useState("")

  // Filtered data based on search
  const [filteredAbilities, setFilteredAbilities] = useState(pokemon.abilities)
  const [filteredItems, setFilteredItems] = useState(items)
  const [filteredMoves, setFilteredMoves] = useState(moves)
  const [filteredNatures, setFilteredNatures] = useState(natures)

  // Update filtered abilities when search changes
  useEffect(() => {
    if (!abilitySearch.trim()) {
      setFilteredAbilities(pokemon.abilities)
    } else {
      const searchTerm = abilitySearch.toLowerCase()
      setFilteredAbilities(pokemon.abilities.filter((ability: string) => ability.toLowerCase().includes(searchTerm)))
    }
  }, [abilitySearch, pokemon.abilities])

  // Update filtered items when search changes
  useEffect(() => {
    if (!itemSearch.trim()) {
      setFilteredItems(items)
    } else {
      const searchTerm = itemSearch.toLowerCase()
      setFilteredItems(
        items.filter(
          (item) => item.name.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm),
        ),
      )
    }
  }, [itemSearch])

  // Update filtered moves when search changes
  useEffect(() => {
    if (!moveSearch.some((s) => s.trim())) {
      setFilteredMoves(moves)
    } else {
      setFilteredMoves(
        moves.filter((move) => {
          // If any search field is non-empty, check if the move matches
          return moveSearch.some((search, index) => {
            if (!search.trim()) return false
            const searchTerm = search.toLowerCase()
            return (
              move.name.toLowerCase().includes(searchTerm) ||
              move.type.toLowerCase().includes(searchTerm) ||
              move.description.toLowerCase().includes(searchTerm) ||
              (move.category && move.category.toLowerCase().includes(searchTerm))
            )
          })
        }),
      )
    }
  }, [moveSearch])

  // Update filtered natures when search changes
  useEffect(() => {
    if (!natureSearch.trim()) {
      setFilteredNatures(natures)
    } else {
      const searchTerm = natureSearch.toLowerCase()
      setFilteredNatures(
        natures.filter(
          (nature) =>
            nature.name.toLowerCase().includes(searchTerm) || nature.description.toLowerCase().includes(searchTerm),
        ),
      )
    }
  }, [natureSearch])

  // Format stat name
  const formatStatName = (stat: string) => {
    switch (stat) {
      case "hp":
        return "HP"
      case "attack":
        return "Attack"
      case "defense":
        return "Defense"
      case "spAttack":
        return "Sp. Atk"
      case "spDefense":
        return "Sp. Def"
      case "speed":
        return "Speed"
      default:
        return stat
    }
  }

  // Update EVs with validation
  const updateEVs = (stat: string, value: number) => {
    const currentTotal = Object.values(pokemon.evs).reduce((sum, ev) => sum + (ev as number), 0)
    const currentStatValue = pokemon.evs[stat as keyof typeof pokemon.evs] as number
    const difference = value - currentStatValue

    // Ensure total EVs don't exceed 510
    if (currentTotal + difference > 510) {
      // If exceeding, cap at 510 total
      value = currentStatValue + (510 - currentTotal)
    }

    // Ensure individual stat doesn't exceed 252
    value = Math.min(value, 252)

    // Ensure value is not negative
    value = Math.max(value, 0)

    // Update the EVs
    const newEvs = { ...pokemon.evs, [stat]: value }
    onUpdate({ evs: newEvs })
  }

  // Update IVs with validation
  const updateIVs = (stat: string, value: number) => {
    // Ensure IV is between 0 and 31
    value = Math.max(0, Math.min(31, value))

    // Update the IVs
    const newIvs = { ...pokemon.ivs, [stat]: value }
    onUpdate({ ivs: newIvs })
  }

  // Update moves
  const updateMove = (index: number, moveName: string) => {
    const newMoves = [...pokemon.moves]
    newMoves[index] = moveName
    onUpdate({ moves: newMoves })
  }

  // Update move search
  const updateMoveSearch = (index: number, value: string) => {
    const newMoveSearch = [...moveSearch]
    newMoveSearch[index] = value
    setMoveSearch(newMoveSearch)
  }

  // Find item details
  const getItemDetails = (itemName: string) => {
    return items.find((item) => item.name === itemName) || null
  }

  // Find ability details
  const getAbilityDetails = (abilityName: string) => {
    return abilities.find((ability) => ability.name === abilityName) || null
  }

  // Find move details
  const getMoveDetails = (moveName: string) => {
    return moves.find((move) => move.name === moveName) || null
  }

  // Find nature details
  const getNatureDetails = (natureName: string) => {
    return natures.find((nature) => nature.name === natureName) || null
  }

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
              <Select value={pokemon.ability} onValueChange={(value) => onUpdate({ ability: value })}>
                <SelectTrigger id="ability" className="mt-1">
                  <SelectValue placeholder="Select ability" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center px-2 py-1.5 border-b sticky top-0 bg-background z-10">
                    <Search className="w-4 h-4 mr-2 opacity-50" />
                    <Input
                      placeholder="Search abilities..."
                      value={abilitySearch}
                      onChange={(e) => setAbilitySearch(e.target.value)}
                      className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    {filteredAbilities.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No abilities found.</div>
                    ) : (
                      filteredAbilities.map((abilityName: string) => {
                        const abilityData = getAbilityDetails(abilityName)
                        return (
                          <SelectItem key={abilityName} value={abilityName} className="py-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{abilityName}</span>
                              {abilityData && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {abilityData.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item">Item</Label>
              <Select
                value={pokemon.item || "none"}
                onValueChange={(value) => onUpdate({ item: value === "none" ? "" : value })}
              >
                <SelectTrigger id="item" className="mt-1">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center px-2 py-1.5 border-b sticky top-0 bg-background z-10">
                    <Search className="w-4 h-4 mr-2 opacity-50" />
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
                      <div className="py-6 text-center text-sm text-muted-foreground">No items found.</div>
                    ) : (
                      filteredItems.map((item) => (
                        <SelectItem key={item.name} value={item.name} className="py-2">
                          <div className="flex items-start gap-2">
                            <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-6 w-6 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground line-clamp-2">{item.description}</span>
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
              <Select value={pokemon.nature} onValueChange={(value) => onUpdate({ nature: value })}>
                <SelectTrigger id="nature" className="mt-1">
                  <SelectValue placeholder="Select nature" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center px-2 py-1.5 border-b sticky top-0 bg-background z-10">
                    <Search className="w-4 h-4 mr-2 opacity-50" />
                    <Input
                      placeholder="Search natures..."
                      value={natureSearch}
                      onChange={(e) => setNatureSearch(e.target.value)}
                      className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <ScrollArea className="h-[300px]">
                    {filteredNatures.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">No natures found.</div>
                    ) : (
                      filteredNatures.map((nature) => (
                        <SelectItem key={nature.name} value={nature.name} className="py-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{nature.name}</span>
                            <span className="text-xs text-muted-foreground">{nature.description}</span>
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

        {/* Moves Tab */}
        <TabsContent value="moves" className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                <Label htmlFor={`move-${index}`}>Move {index + 1}</Label>
                <Select
                  value={pokemon.moves[index] || "none"}
                  onValueChange={(value) => updateMove(index, value === "none" ? "" : value)}
                >
                  <SelectTrigger id={`move-${index}`} className="mt-1">
                    <SelectValue placeholder="Select move" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="flex items-center px-2 py-1.5 border-b sticky top-0 bg-background z-10">
                      <Search className="w-4 h-4 mr-2 opacity-50" />
                      <Input
                        placeholder="Search moves..."
                        value={moveSearch[index]}
                        onChange={(e) => updateMoveSearch(index, e.target.value)}
                        className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <ScrollArea className="h-[300px]">
                      <SelectItem value="none" className="py-2">
                        <div className="flex items-center">
                          <span className="font-medium">None</span>
                        </div>
                      </SelectItem>
                      {filteredMoves.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">No moves found.</div>
                      ) : (
                        filteredMoves.map((move) => (
                          <SelectItem key={move.name} value={move.name} className="py-2">
                            <div className="flex items-start gap-2">
                              <Badge
                                className={`${typeColors[move.type]} h-5 w-5 p-0 flex items-center justify-center mt-0.5`}
                              >
                                <span className="sr-only">{move.type}</span>
                              </Badge>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{move.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {move.power ? `${move.power} BP` : "Status"}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground line-clamp-2">{move.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* EVs Tab */}
        <TabsContent value="evs" className="py-4">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <Label>EV Distribution</Label>
              <div className="text-sm text-muted-foreground">
                {Object.values(pokemon.evs).reduce((sum, ev) => sum + (ev as number), 0)}/510
              </div>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(Object.values(pokemon.evs).reduce((sum, ev) => sum + (ev as number), 0) / 510) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(pokemon.evs).map(([stat, value]) => (
              <div key={stat}>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`ev-${stat}`}>{formatStatName(stat)}</Label>
                  <div className="text-sm">{value}/252</div>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    id={`ev-${stat}`}
                    value={[value as number]}
                    min={0}
                    max={252}
                    step={4}
                    onValueChange={(val) => updateEVs(stat, val[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={value as number}
                    onChange={(e) => updateEVs(stat, Number.parseInt(e.target.value) || 0)}
                    className="w-16"
                    min={0}
                    max={252}
                    step={4}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* IVs Tab */}
        <TabsContent value="ivs" className="py-4">
          <div className="space-y-4">
            {Object.entries(pokemon.ivs).map(([stat, value]) => (
              <div key={stat}>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`iv-${stat}`}>{formatStatName(stat)}</Label>
                  <div className="text-sm">{value}/31</div>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    id={`iv-${stat}`}
                    value={[value as number]}
                    min={0}
                    max={31}
                    step={1}
                    onValueChange={(val) => updateIVs(stat, val[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={value as number}
                    onChange={(e) => updateIVs(stat, Number.parseInt(e.target.value) || 0)}
                    className="w-16"
                    min={0}
                    max={31}
                    step={1}
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  onUpdate({
                    ivs: {
                      hp: 31,
                      attack: 31,
                      defense: 31,
                      spAttack: 31,
                      spDefense: 31,
                      speed: 31,
                    },
                  })
                }
              >
                Max All
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  onUpdate({
                    ivs: {
                      hp: 31,
                      attack: 0,
                      defense: 31,
                      spAttack: 31,
                      spDefense: 31,
                      speed: 0,
                    },
                  })
                }
              >
                Trick Room
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>
          <Check className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </DialogFooter>
    </>
  )
}

