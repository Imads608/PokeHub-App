import { Species } from '@pkmn/dex';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { Dna, Ruler, Weight } from 'lucide-react';
import Image from 'next/image';
import { Pokemon, PokemonSpecies } from 'pokeapi-js-wrapper';
import { useEffect, useState } from 'react';

export interface PokemonHeaderContainerProps {
  pokemonDetails: Species;
  pokemonPokeAPIDetails?: Pokemon;
  pokemonSpeciesPokeAPIDetails?: PokemonSpecies;
}

export const PokemonHeaderContainer = ({
  pokemonDetails,
  pokemonPokeAPIDetails,
  pokemonSpeciesPokeAPIDetails,
}: PokemonHeaderContainerProps) => {
  const [pokemonCategory, setPokemonCategory] = useState<string>('-');

  useEffect(() => {
    if (pokemonSpeciesPokeAPIDetails) {
      const category = pokemonSpeciesPokeAPIDetails.genera.find(
        (gen) => gen.language.name === 'en'
      )?.genus;
      setPokemonCategory(category || '-');
    }
  }, [pokemonSpeciesPokeAPIDetails]);
  return (
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
              <p className="mt-1 text-lg font-semibold">{pokemonCategory}</p>
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
  );
};
