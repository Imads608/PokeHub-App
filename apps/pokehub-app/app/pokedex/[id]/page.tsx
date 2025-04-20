'use client';

import { GenerationNum, ID } from '@pkmn/dex';
import {
  usePokedexByID,
  usePokemonPokeAPIDetails,
} from '@pokehub/frontend/dex-data-provider';
import { usePokemonDetails } from '@pokehub/frontend/pokehub-dex-components';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Dna,
  History,
  Ruler,
  Weight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function PokemonPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  // Generation data with changes
  const generationData = useMemo(
    () => [
      {
        id: 1,
        name: 'Generation I',
        games: 'Red/Blue/Yellow',
        years: '1996-1999',
      },
      {
        id: 2,
        name: 'Generation II',
        games: 'Gold/Silver/Crystal',
        years: '1999-2002',
      },
      {
        id: 3,
        name: 'Generation III',
        games: 'Ruby/Sapphire/Emerald/FireRed/LeafGreen',
        years: '2002-2006',
      },
      {
        id: 4,
        name: 'Generation IV',
        games: 'Diamond/Pearl/Platinum/HeartGold/SoulSilver',
        years: '2006-2010',
      },
      {
        id: 5,
        name: 'Generation V',
        games: 'Black/White/Black 2/White 2',
        years: '2010-2013',
      },
      {
        id: 6,
        name: 'Generation VI',
        games: 'X/Y/Omega Ruby/Alpha Sapphire',
        years: '2013-2016',
      },
      {
        id: 7,
        name: 'Generation VII',
        games: "Sun/Moon/Ultra Sun/Ultra Moon/Let's Go",
        years: '2016-2019',
      },
      {
        id: 8,
        name: 'Generation VIII',
        games: 'Sword/Shield/Brilliant Diamond/Shining Pearl/Legends',
        years: '2019-2022',
      },
      {
        id: 9,
        name: 'Generation IX',
        games: 'Scarlet/Violet',
        years: '2022-Present',
      },
    ],
    []
  );

  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationNum>(9);

  const navigateToPokemon = (newId: string) => {
    router.push(`/pokedex/${newId}`);
  };

  const { data: pokemonDetails, isLoading: isPokemonDetailsLoading } =
    usePokemonDetails(id as ID, {
      generation: selectedGeneration === 9 ? undefined : selectedGeneration,
    });
  const { data: pokemonPokeAPIDetails } = usePokemonPokeAPIDetails(
    pokemonDetails?.num
  );
  const { data: pokedexByID } = usePokedexByID();

  if (isPokemonDetailsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-20">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading Pokémon data...</p>
        </div>
      </div>
    );
  } else if (!pokemonDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background pt-20">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Pokémon Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            {"The Pokémon you're looking for doesn't exist or has fled"}.
          </p>
          <Button asChild>
            <Link href="/pokedex">Return to Pokédex</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/pokedex">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Pokédex
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {pokemonDetails.num > 1 &&
              pokedexByID &&
              pokedexByID[pokemonDetails.num - 1] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigateToPokemon(pokedexByID[pokemonDetails.num - 1].id)
                  }
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />#
                  {(pokemonDetails.num - 1).toString().padStart(3, '0')}
                </Button>
              )}
            {pokedexByID && pokedexByID[pokemonDetails.num + 1] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigateToPokemon(pokedexByID[pokemonDetails.num + 1].id)
                }
              >
                #{(pokemonDetails.num + 1).toString().padStart(3, '0')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Generation Selector */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">View data from:</span>
            <Select
              value={selectedGeneration.toString()}
              onValueChange={(value) =>
                setSelectedGeneration(Number.parseInt(value) as GenerationNum)
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {generationData.map(
                  (gen) =>
                    gen.id >= pokemonDetails.gen && (
                      <SelectItem key={gen.id} value={gen.id.toString()}>
                        {gen.name} ({gen.games})
                      </SelectItem>
                    )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Historical View Alert */}
        {selectedGeneration !== 9 && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              You are viewing historical data from{' '}
              {generationData[selectedGeneration - 1].name} (
              {generationData[selectedGeneration - 1].years})
            </AlertDescription>
          </Alert>
        )}

        {/* Illegal Pokemon Alert */}
        {pokemonDetails.tier === 'Illegal' && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Clock className="h-4 w-4" />
              This Pokémon is not obtainable in this Generation.
            </AlertDescription>
          </Alert>
        )}

        {/* Pokemon Header */}
        <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg font-semibold text-muted-foreground">
                  #{pokemonDetails.num.toString().padStart(3, '0')}
                </span>
                <h1 className="text-3xl font-bold md:text-4xl">
                  {pokemonDetails.name}
                </h1>
              </div>
              <div className="mb-4 flex gap-2">
                {pokemonDetails.types.map((type) => (
                  <Badge
                    key={type}
                    className={`${
                      typeColors[type as keyof typeof typeColors]
                    } text-sm capitalize`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <p className="mb-6 text-muted-foreground">
                {pokemonDetails.shortDesc}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                    Height
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    {pokemonPokeAPIDetails
                      ? pokemonPokeAPIDetails.height / 10
                      : '-'}{' '}
                    m
                  </p>
                </div>
                <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Weight className="h-4 w-4" />
                    Weight
                  </div>
                  <p className="mt-1 text-lg font-semibold">
                    {pokemonPokeAPIDetails
                      ? pokemonPokeAPIDetails.weight / 10
                      : '-'}{' '}
                    kg
                  </p>
                </div>
                <div className="rounded-lg bg-background/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Dna className="h-4 w-4" />
                    Category
                  </div>
                  <p className="mt-1 text-lg font-semibold">{'categor'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <Image
                  src={
                    pokemonPokeAPIDetails?.sprites.other['official-artwork']
                      .front_default || '/placeholder.svg'
                  }
                  height={200}
                  width={300}
                  alt={pokemonDetails.name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
