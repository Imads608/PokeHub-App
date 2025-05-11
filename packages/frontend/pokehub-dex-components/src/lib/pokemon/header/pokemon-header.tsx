import { usePokemonDexDetailsContext } from '../context/pokemon-dex-details.context';
import type { Species } from '@pkmn/dex';
import { Badge, Button } from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { Dna, Ruler, Weight } from 'lucide-react';
import Image from 'next/image';
import type { Pokemon, PokemonSpecies } from 'pokeapi-js-wrapper';
import { useCallback, useEffect, useState } from 'react';

export interface PokemonHeaderContainerProps {
  pokemonForms?: { dex: Species; pokeAPI: Pokemon }[];
  pokeAPISpecies?: PokemonSpecies;
}

export const PokemonHeaderContainer = ({
  pokemonForms,
  pokeAPISpecies,
}: PokemonHeaderContainerProps) => {
  const {
    selectedForm: { pokemon, pokemonPokeAPI },
  } = usePokemonDexDetailsContext();
  const [pokemonCategory, setPokemonCategory] = useState<string>('-');

  useEffect(() => {
    if (pokeAPISpecies) {
      const category = pokeAPISpecies.genera.find(
        (gen) => gen.language.name === 'en'
      )?.genus;
      setPokemonCategory(category || '-');
    }
  }, [pokeAPISpecies]);

  const setSelectedPokemon = useCallback(
    (index: number) => {
      if (pokemonForms && pokemonForms[index]) {
        pokemon.setValue(pokemonForms[index].dex);
        pokemonPokeAPI.setValue(pokemonForms[index].pokeAPI);
      }
    },
    [pokemonForms]
  );

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg font-semibold text-muted-foreground">
              #{pokemon.value?.num.toString().padStart(3, '0')}
            </span>
            <h1 className="text-3xl font-bold md:text-4xl">
              {pokemon.value?.name}
            </h1>
          </div>
          <div className="mb-4 flex gap-2">
            {pokemon.value?.types.map((type) => (
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
            {pokemon.value?.shortDesc}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-background/80 p-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Ruler className="h-4 w-4" />
                Height
              </div>
              <p className="mt-1 text-lg font-semibold">
                {pokemonPokeAPI.value ? pokemonPokeAPI.value.height / 10 : '-'}{' '}
                m
              </p>
            </div>
            <div className="rounded-lg bg-background/80 p-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Weight className="h-4 w-4" />
                Weight
              </div>
              <p className="mt-1 text-lg font-semibold">
                {pokemonPokeAPI.value ? pokemonPokeAPI.value.weight / 10 : '-'}{' '}
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
        <div className="flex-col items-center justify-center">
          <div className="flex items-center justify-center">
            <Image
              src={
                pokemonPokeAPI.value?.sprites.other['official-artwork']
                  .front_default ||
                'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAACH5BAEAAAEALAAAAAAQABAAAAIgjI+py+0Po5y02ouzPgUAOw=='
              }
              height={200}
              width={300}
              alt={pokemon.value?.name || ''}
            />
          </div>
          {/* Form Selector */}
          {pokemonForms && pokemonForms.length > 1 && (
            <div className="mt-4 w-full rounded-md bg-background/80 p-2">
              <h3 className="mb-2 text-center text-sm font-medium">Forms</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {pokemonForms.map((form, index) => (
                  <Button
                    key={form.dex.id}
                    variant={
                      pokemon.value?.id === form.dex.id ? 'default' : 'outline'
                    }
                    onClick={() => setSelectedPokemon(index)}
                    size="sm"
                    className={`relative h-auto min-w-[60px] p-1 `}
                    title={form.dex.name}
                  >
                    <div className="flex flex-col items-center">
                      <Image
                        src={
                          form.pokeAPI.sprites.other['official-artwork']
                            .front_default ||
                          'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAACH5BAEAAAEALAAAAAAQABAAAAIgjI+py+0Po5y02ouzPgUAOw=='
                        }
                        height={100}
                        width={100}
                        alt={form.dex.name}
                        className="mb-1 object-contain"
                      />
                      <span className="w-full truncate px-1 text-center text-xs font-medium">
                        {index === 0
                          ? 'Normal'
                          : form.dex.forme || form.dex.baseForme}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
