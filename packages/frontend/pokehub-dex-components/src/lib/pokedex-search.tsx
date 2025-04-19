'use client';

import {
  Button,
  Input,
  Card,
  CardContent,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Slider,
} from '@pokehub/frontend/shared-ui-components';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// Pokemon type colors
const typeColors = {
  normal: 'bg-gray-400 text-white',
  fire: 'bg-orange-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-yellow-400 text-black',
  grass: 'bg-green-500 text-white',
  ice: 'bg-blue-200 text-black',
  fighting: 'bg-red-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-black',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-white',
  rock: 'bg-yellow-700 text-white',
  ghost: 'bg-purple-700 text-white',
  dragon: 'bg-indigo-600 text-white',
  dark: 'bg-gray-700 text-white',
  steel: 'bg-gray-400 text-white',
  fairy: 'bg-pink-300 text-black',
};

// Mock data for Pokemon
const pokemonData = Array.from({ length: 151 }, (_, i) => ({
  id: i + 1,
  name: `Pokemon ${i + 1}`,
  types: [
    Object.keys(typeColors)[
      Math.floor(Math.random() * Object.keys(typeColors).length)
    ],
    Object.keys(typeColors)[
      Math.floor(Math.random() * Object.keys(typeColors).length)
    ],
  ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
  image: `/placeholder.svg?height=120&width=120&text=${i + 1}`,
  stats: {
    hp: Math.floor(Math.random() * 100) + 50,
    attack: Math.floor(Math.random() * 100) + 50,
    defense: Math.floor(Math.random() * 100) + 50,
    spAttack: Math.floor(Math.random() * 100) + 50,
    spDefense: Math.floor(Math.random() * 100) + 50,
    speed: Math.floor(Math.random() * 100) + 50,
  },
  height: (Math.random() * 20).toFixed(1),
  weight: (Math.random() * 1000).toFixed(1),
  generation: Math.ceil((i + 1) / 151),
}));

// Replace some with actual Pokemon names for realism
const realPokemonNames = [
  'Bulbasaur',
  'Ivysaur',
  'Venusaur',
  'Charmander',
  'Charmeleon',
  'Charizard',
  'Squirtle',
  'Wartortle',
  'Blastoise',
  'Pikachu',
  'Raichu',
  'Jigglypuff',
  'Mewtwo',
  'Mew',
  'Eevee',
  'Vaporeon',
  'Jolteon',
  'Flareon',
  'Snorlax',
  'Dragonite',
];

realPokemonNames.forEach((name, i) => {
  if (i < pokemonData.length) {
    pokemonData[i].name = name;
  }
});

export default function PokedexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<
    'id' | 'name' | 'hp' | 'attack' | 'defense'
  >('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statFilters, setStatFilters] = useState({
    hp: [0, 255],
    attack: [0, 255],
    defense: [0, 255],
    speed: [0, 255],
  });
  const [filteredPokemon, setFilteredPokemon] = useState(pokemonData);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Apply filters and sorting
  useEffect(() => {
    let result = pokemonData;

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (pokemon) =>
          pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pokemon.id.toString().includes(searchTerm)
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      result = result.filter((pokemon) =>
        selectedTypes.some((type) => pokemon.types.includes(type))
      );
    }

    // Generation filter
    if (selectedGenerations.length > 0) {
      result = result.filter((pokemon) =>
        selectedGenerations.includes(pokemon.generation)
      );
    }

    // Stat filters
    result = result.filter(
      (pokemon) =>
        pokemon.stats.hp >= statFilters.hp[0] &&
        pokemon.stats.hp <= statFilters.hp[1] &&
        pokemon.stats.attack >= statFilters.attack[0] &&
        pokemon.stats.attack <= statFilters.attack[1] &&
        pokemon.stats.defense >= statFilters.defense[0] &&
        pokemon.stats.defense <= statFilters.defense[1] &&
        pokemon.stats.speed >= statFilters.speed[0] &&
        pokemon.stats.speed <= statFilters.speed[1]
    );

    // Sorting
    result = [...result].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = a.name;
          valueB = b.name;
          return sortOrder === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case 'hp':
          valueA = a.stats.hp;
          valueB = b.stats.hp;
          break;
        case 'attack':
          valueA = a.stats.attack;
          valueB = b.stats.attack;
          break;
        case 'defense':
          valueA = a.stats.defense;
          valueB = b.stats.defense;
          break;
        default: // id
          valueA = a.id;
          valueB = b.id;
      }

      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    setFilteredPokemon(result);
  }, [
    searchTerm,
    selectedTypes,
    selectedGenerations,
    sortBy,
    sortOrder,
    statFilters,
  ]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerationToggle = (gen: number) => {
    setSelectedGenerations((prev) =>
      prev.includes(gen) ? prev.filter((g) => g !== gen) : [...prev, gen]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedGenerations([]);
    setSortBy('id');
    setSortOrder('asc');
    setStatFilters({
      hp: [0, 255],
      attack: [0, 255],
      defense: [0, 255],
      speed: [0, 255],
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Pokédex</h1>
          <p className="mt-2 text-muted-foreground">
            Explore and discover all Pokémon with detailed information
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar filters - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border bg-card p-4 shadow-sm">
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

              <Accordion
                type="multiple"
                defaultValue={['types', 'generations', 'stats']}
              >
                {/* Types filter */}
                <AccordionItem value="types">
                  <AccordionTrigger className="text-sm font-medium">
                    Types
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {Object.entries(typeColors).map(([type, colorClass]) => (
                        <Badge
                          key={type}
                          className={`cursor-pointer capitalize ${
                            selectedTypes.includes(type)
                              ? colorClass
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          onClick={() => handleTypeToggle(type)}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Generations filter */}
                <AccordionItem value="generations">
                  <AccordionTrigger className="text-sm font-medium">
                    Generations
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
                        <Badge
                          key={gen}
                          className={`cursor-pointer ${
                            selectedGenerations.includes(gen)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          onClick={() => handleGenerationToggle(gen)}
                        >
                          Gen {gen}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Stats filter */}
                <AccordionItem value="stats">
                  <AccordionTrigger className="text-sm font-medium">
                    Stats
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">HP</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.hp[0]} - {statFilters.hp[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.hp}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              hp: value as [number, number],
                            }))
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">Attack</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.attack[0]} - {statFilters.attack[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.attack}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              attack: value as [number, number],
                            }))
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">Defense</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.defense[0]} - {statFilters.defense[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.defense}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              defense: value as [number, number],
                            }))
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">Speed</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.speed[0]} - {statFilters.speed[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.speed}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              speed: value as [number, number],
                            }))
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Main content area */}
          <div>
            {/* Search and controls */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
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

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {(selectedTypes.length > 0 ||
                    selectedGenerations.length > 0) && (
                    <Badge className="ml-2 bg-primary text-primary-foreground">
                      {selectedTypes.length + selectedGenerations.length}
                    </Badge>
                  )}
                </Button>

                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSortBy('id')}>
                      Number{' '}
                      {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      Name{' '}
                      {sortBy === 'name' &&
                        (sortOrder === 'asc' ? 'A-Z' : 'Z-A')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('hp')}>
                      HP {sortBy === 'hp' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('attack')}>
                      Attack{' '}
                      {sortBy === 'attack' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('defense')}>
                      Defense{' '}
                      {sortBy === 'defense' &&
                        (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleSortOrder}>
                      Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View mode toggle */}
                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none border-r"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile filters (collapsible) */}
            {isMobileFilterOpen && (
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
                    <TabsTrigger value="stats" className="flex-1">
                      Stats
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="types" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(typeColors).map(([type, colorClass]) => (
                        <Badge
                          key={type}
                          className={`cursor-pointer capitalize ${
                            selectedTypes.includes(type)
                              ? colorClass
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          onClick={() => handleTypeToggle(type)}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="generations" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
                        <Badge
                          key={gen}
                          className={`cursor-pointer ${
                            selectedGenerations.includes(gen)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                          onClick={() => handleGenerationToggle(gen)}
                        >
                          Gen {gen}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">HP</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.hp[0]} - {statFilters.hp[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.hp}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              hp: value as [number, number],
                            }))
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">Attack</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.attack[0]} - {statFilters.attack[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.attack}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              attack: value as [number, number],
                            }))
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">Defense</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.defense[0]} - {statFilters.defense[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.defense}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              defense: value as [number, number],
                            }))
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs font-medium">Speed</label>
                          <span className="text-xs text-muted-foreground">
                            {statFilters.speed[0]} - {statFilters.speed[1]}
                          </span>
                        </div>
                        <Slider
                          value={statFilters.speed}
                          min={0}
                          max={255}
                          step={5}
                          onValueChange={(value) =>
                            setStatFilters((prev) => ({
                              ...prev,
                              speed: value as [number, number],
                            }))
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Results count */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPokemon.length} of {pokemonData.length} Pokémon
              </p>
            </div>

            {/* Pokemon grid/list */}
            {filteredPokemon.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {filteredPokemon.map((pokemon) => (
                    <Link href={`/pokedex/${pokemon.id}`} key={pokemon.id}>
                      <Card className="overflow-hidden transition-all hover:shadow-md">
                        <div className="bg-muted/50 p-4">
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                              #{pokemon.id.toString().padStart(3, '0')}
                            </span>
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
                            <img
                              src={pokemon.image || '/placeholder.svg'}
                              alt={pokemon.name}
                              className="h-24 w-24 object-contain transition-transform hover:scale-110"
                            />
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-semibold">{pokemon.name}</h3>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPokemon.map((pokemon) => (
                    <Link href={`/pokedex/${pokemon.id}`} key={pokemon.id}>
                      <Card className="overflow-hidden transition-all hover:shadow-md">
                        <div className="flex items-center p-3">
                          <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                            <img
                              src={pokemon.image || '/placeholder.svg'}
                              alt={pokemon.name}
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-muted-foreground">
                                #{pokemon.id.toString().padStart(3, '0')}
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
                              <p className="text-xs text-muted-foreground">
                                HP
                              </p>
                              <p className="font-medium">{pokemon.stats.hp}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                ATK
                              </p>
                              <p className="font-medium">
                                {pokemon.stats.attack}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                DEF
                              </p>
                              <p className="font-medium">
                                {pokemon.stats.defense}
                              </p>
                            </div>
                            <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-medium">No Pokémon Found</h3>
                <p className="text-center text-muted-foreground">
                  Try adjusting your search or filters to find what you're
                  looking for.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
